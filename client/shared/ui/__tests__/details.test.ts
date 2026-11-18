import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUsers } from '@/shared/lib'
import Details from '../details.vue'
import { makeMovie, makeSeries } from './fixtures'

import.meta.env.VITE_SEARCH_URL = 'http://localhost?q='

const user = userEvent.setup()

const renderDetails = (data: Parameters<typeof makeMovie>[0] = {}) =>
  render(Details, { props: { data: makeMovie(data) } })

describe('details', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the title with a search link', () => {
    // arrange
    // act
    renderDetails()

    // assert
    expect(screen.getByRole('link', { name: 'Some Movie' })).toHaveAttribute('href', 'http://localhost?q=some%20movie')
  })

  it('shows the omdb extra fields and the imdb link for a movie', () => {
    // arrange
    // act
    renderDetails({ extra: { Runtime: '120 min', Actors: 'Actor A', Director: 'Director B' } })

    // assert
    expect(screen.getByText('120 min')).toBeInTheDocument()
    expect(screen.getByText('Actor A')).toBeInTheDocument()
    expect(screen.getByText('Director B')).toBeInTheDocument()
    expect(screen.queryByText('Season')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open on IMDB' })).toHaveAttribute(
      'href',
      'https://www.imdb.com/title/tt123',
    )
  })

  it('hides the omdb fields, the imdb link and the refresh action for a manual row', () => {
    // arrange
    // act
    renderDetails({
      provider: 'manual',
      extra: { Runtime: '120 min', Actors: 'Actor A', Director: 'Director B' },
    })

    // assert
    expect(screen.queryByText('120 min')).not.toBeInTheDocument()
    expect(screen.queryByText('Actor A')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Open on IMDB' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Refresh details' })).not.toBeInTheDocument()
  })

  it('keeps N/A omdb values out of the view', () => {
    // arrange
    // act
    renderDetails({ extra: { Runtime: 'N/A', Actors: 'N/A', Director: 'Director B' } })

    // assert
    expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    expect(screen.getByText('Director B')).toBeInTheDocument()
  })

  it('renders the season toggler with the total for a series', () => {
    // arrange
    // act
    render(Details, { props: { data: makeSeries({ season: 2, extra: { totalSeasons: '8' } }) } })

    // assert
    expect(screen.getByTestId('season-plus')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('of 8')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Some Series' })).toHaveAttribute(
      'href',
      'http://localhost?q=some%20series%202',
    )
    expect(screen.getByRole('link', { name: 'Open on IMDB' })).toHaveAttribute(
      'href',
      'https://www.imdb.com/title/tt456/episodes/?season=2',
    )
  })

  it('emits updateSeason when the season is changed', async () => {
    // arrange
    const onUpdateSeason = vi.fn()
    render(Details, { props: { data: makeSeries({ season: 2 }), onUpdateSeason } })

    // act
    await user.click(screen.getByTestId('season-plus'))

    // assert
    expect(onUpdateSeason).toHaveBeenCalledExactlyOnceWith(3)
  })

  it('emits edit when the edit button is clicked', async () => {
    // arrange
    const onEdit = vi.fn()
    render(Details, { props: { data: makeMovie(), onEdit } })

    // act
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    // assert
    expect(onEdit).toHaveBeenCalledExactlyOnceWith()
  })

  it('emits seen when Finished is clicked on an unseen item', async () => {
    // arrange
    const onSeen = vi.fn()
    render(Details, { props: { data: makeMovie(), onSeen } })

    // act
    await user.click(screen.getByRole('button', { name: 'Finished' }))

    // assert
    expect(onSeen).toHaveBeenCalledExactlyOnceWith()
  })

  it('emits removeView when Not Seen is clicked on a seen item', async () => {
    // arrange
    const onRemoveView = vi.fn()
    render(Details, { props: { data: makeMovie({ seen: '2024-01-15', seenRating: 8 }), onRemoveView } })

    // act
    await user.click(screen.getByRole('button', { name: 'Not Seen' }))

    // assert
    expect(onRemoveView).toHaveBeenCalledExactlyOnceWith()
  })

  it('emits refresh when the refresh icon is clicked', async () => {
    // arrange
    const onRefresh = vi.fn()
    render(Details, { props: { data: makeMovie(), onRefresh } })

    // act
    await user.click(screen.getByRole('button', { name: 'Refresh details' }))

    // assert
    expect(onRefresh).toHaveBeenCalledExactlyOnceWith()
  })

  it('shows a spinner instead of the refresh action while refreshing', () => {
    // arrange
    // act
    render(Details, { props: { data: makeMovie(), refreshing: true } })

    // assert
    expect(screen.queryByRole('button', { name: 'Refresh details' })).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('shows the creator username', () => {
    // arrange
    useUsers().all = [{ id: 'user-1', username: 'me' }]

    // act
    renderDetails()

    // assert
    expect(screen.getByText('Added by')).toBeInTheDocument()
    expect(screen.getByText('me')).toBeInTheDocument()
  })

  it('shows the recommender when one is set', () => {
    // arrange
    useUsers().all = [
      { id: 'user-1', username: 'me' },
      { id: 'user-2', username: 'other' },
    ]

    // act
    renderDetails({ recommendedBy: 'user-2' })

    // assert
    expect(screen.getByText('Recommended by')).toBeInTheDocument()
    expect(screen.getByText('other')).toBeInTheDocument()
  })

  it('falls back to Unknown when the creator is not in the directory', () => {
    // arrange
    // act
    renderDetails({ createdBy: 'deleted-user' })

    // assert
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
