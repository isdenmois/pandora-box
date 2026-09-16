import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/shared/lib'
import Details from '../details.vue'
import { makeMovie, makeSeries } from './fixtures'

import.meta.env.VITE_SEARCH_URL = 'http://localhost?q='

const user = userEvent.setup()

describe('details', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the title with a search link', () => {
    // arrange
    // act
    render(Details, { props: { data: makeMovie() } })

    // assert
    expect(screen.getByRole('link', { name: 'Some Movie' })).toHaveAttribute('href', 'http://localhost?q=some%20movie')
  })

  it('shows the omdb extra fields and the imdb link for a movie', () => {
    // arrange
    // act
    render(Details, {
      props: {
        data: makeMovie({ extra: { Runtime: '120 min', Actors: 'Actor A', Director: 'Director B' } }),
      },
    })

    // assert
    expect(screen.getByText('120 min')).toBeInTheDocument()
    expect(screen.getByText('Actor A')).toBeInTheDocument()
    expect(screen.getByText('Director B')).toBeInTheDocument()
    expect(screen.queryByText('Season')).not.toBeInTheDocument()
    expect(document.querySelector('a[href="https://www.imdb.com/title/tt123"]')).toBeInTheDocument()
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
    expect(document.querySelector('a[href="https://www.imdb.com/title/tt456/episodes/?season=2"]')).toBeInTheDocument()
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
    const { container } = render(Details, { props: { data: makeMovie(), onRefresh } })

    // act
    await user.click(container.querySelector('.cursor-pointer')!)

    // assert
    expect(onRefresh).toHaveBeenCalledExactlyOnceWith()
  })

  it('shows the spinner instead of the refresh action while refreshing', () => {
    // arrange
    // act
    const { container } = render(Details, { props: { data: makeMovie(), refreshing: true } })

    // assert
    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows Me when the data belongs to the current user', () => {
    // arrange
    useAuth().setUser({ id: 'user-1', username: 'me', role: 'admin' })

    // act
    render(Details, { props: { data: makeMovie() } })

    // assert
    expect(screen.getByText('Me')).toBeInTheDocument()
  })

  it('shows Not me when the data belongs to another user', () => {
    // arrange
    useAuth().setUser({ id: 'someone-else', username: 'other', role: 'user' })

    // act
    render(Details, { props: { data: makeMovie() } })

    // assert
    expect(screen.getByText('Not me')).toBeInTheDocument()
  })
})
