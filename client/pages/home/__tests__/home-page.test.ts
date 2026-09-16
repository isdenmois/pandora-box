import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { api } from '@/shared/api'
import HomePage from '../home-page.vue'
import { makeMovie, makeSeries } from './fixtures'

const RouterLink = defineComponent({
  name: 'RouterLink',
  props: { to: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
})

const RouterView = defineComponent({
  name: 'RouterView',
  setup: () => () => null,
})

const user = userEvent.setup()

const renderHome = () => render(HomePage, { global: { components: { RouterLink, RouterView } } })

const movieIds = () => screen.getAllByTestId(/^movie-/).map((movie) => movie.getAttribute('data-testid'))

const findSpinner = (root: ParentNode) =>
  [...root.querySelectorAll('use')].find((use) =>
    ['xlink:href', 'href'].some((name) => use.getAttribute(name)?.includes('spinner')),
  )

describe('home-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([])
    vi.spyOn(api.series, 'getAll').mockResolvedValue([])
  })

  it('fetches movies and series on mount', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([makeMovie()])
    vi.spyOn(api.series, 'getAll').mockResolvedValue([makeSeries()])

    // act
    renderHome()
    await flushPromises()

    // assert
    expect(api.movie.getAll).toHaveBeenCalledExactlyOnceWith()
    expect(api.series.getAll).toHaveBeenCalledExactlyOnceWith()
    expect(screen.getByTestId('movie-movie-1')).toBeInTheDocument()
    expect(screen.getByTestId('series-series-1')).toBeInTheDocument()
  })

  it('renders the lists with links to the details pages', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([makeMovie()])
    vi.spyOn(api.series, 'getAll').mockResolvedValue([makeSeries()])

    // act
    renderHome()
    await flushPromises()

    // assert
    expect(screen.getByRole('heading', { name: 'Series' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument()
    expect(screen.getByTestId('series-series-1').closest('a')).toHaveAttribute('href', '/details/series/series-1')
    expect(screen.getByTestId('movie-movie-1').closest('a')).toHaveAttribute('href', '/details/movie/movie-1')
  })

  it('hides the section headings when the lists are empty', async () => {
    // arrange
    // act
    renderHome()
    await flushPromises()

    // assert
    expect(screen.queryByRole('heading', { name: 'Series' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Movies' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Scheduled' })).not.toBeInTheDocument()
  })

  it('shows a spinner while a list is loading', async () => {
    // arrange
    vi.spyOn(api.series, 'getAll').mockReturnValue(new Promise(() => {}))
    const { container } = renderHome()

    // act
    await flushPromises()

    // assert
    expect(findSpinner(container)).toBeInTheDocument()
  })

  it('toggles between the global and for-me lists', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([
      makeMovie({ id: 'public', title: 'Public Movie' }),
      makeMovie({ id: 'private', title: 'Private Movie', private: true }),
    ])
    renderHome()
    await flushPromises()

    // assert
    expect(screen.getByTestId('movie-public')).toBeInTheDocument()
    expect(screen.queryByTestId('movie-private')).not.toBeInTheDocument()

    // act
    await user.click(screen.getByText('Global'))

    // assert
    expect(screen.queryByTestId('movie-public')).not.toBeInTheDocument()
    expect(screen.getByTestId('movie-private')).toBeInTheDocument()
  })

  it('cycles the sort button through the sort modes', async () => {
    // arrange
    renderHome()

    // act
    await user.click(screen.getByRole('button', { name: 'by season' }))

    // assert
    expect(screen.getByRole('button', { name: 'by title' })).toBeInTheDocument()

    // act
    await user.click(screen.getByRole('button', { name: 'by title' }))

    // assert
    expect(screen.getByRole('button', { name: 'by rating' })).toBeInTheDocument()

    // act
    await user.click(screen.getByRole('button', { name: 'by rating' }))

    // assert
    expect(screen.getByRole('button', { name: 'by season' })).toBeInTheDocument()
  })

  it('reorders the list when the sort changes', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([
      makeMovie({ id: 'zeta', title: 'Zeta', rating: 7 }),
      makeMovie({ id: 'alpha', title: 'Alpha', rating: 3 }),
    ])
    renderHome()
    await flushPromises()

    // assert
    expect(movieIds()).toEqual(['movie-zeta', 'movie-alpha'])

    // act
    await user.click(screen.getByRole('button', { name: 'by season' }))

    // assert
    expect(movieIds()).toEqual(['movie-alpha', 'movie-zeta'])
  })

  it('switches to the seen list and hides the sort button', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([
      makeMovie({ id: 'seen', title: 'Seen Movie', seen: '2024-01-15', seenRating: 8 }),
      makeMovie({ id: 'unseen', title: 'New Movie' }),
    ])
    renderHome()
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'New' }))

    // assert
    expect(screen.getByRole('button', { name: 'Seen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'by season' })).not.toBeInTheDocument()
    expect(screen.getByTestId('movie-seen')).toBeInTheDocument()
    expect(screen.queryByTestId('movie-unseen')).not.toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('opens and closes the search overlay', async () => {
    // arrange
    const { container } = renderHome()
    const form = () => container.querySelector('form.search')!

    // act
    await user.click(container.querySelector('.surface button:last-of-type')!)

    // assert
    expect(form()).toHaveClass('visible')

    // act
    await user.click(document.body)

    // assert
    expect(form()).not.toHaveClass('visible')
  })

  it('filters the lists by the search query', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([
      makeMovie({ id: 'matrix', title: 'Matrix' }),
      makeMovie({ id: 'inception', title: 'Inception' }),
    ])
    const { container } = renderHome()
    await flushPromises()
    await user.click(container.querySelector('.surface button:last-of-type')!)

    // act
    await user.type(container.querySelector('input[name="filter"]')!, 'matr')

    // assert
    expect(screen.getByTestId('movie-matrix')).toBeInTheDocument()
    expect(screen.queryByTestId('movie-inception')).not.toBeInTheDocument()
  })

  it('filters the list by the selected tag', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([
      makeMovie({ id: 'drama', title: 'Drama Movie', tags: ['drama'] }),
      makeMovie({ id: 'comedy', title: 'Comedy Movie', tags: ['comedy'] }),
    ])
    renderHome()
    await flushPromises()

    // assert
    expect(screen.getByRole('button', { name: 'drama' })).toHaveClass('secondary')

    // act
    await user.click(screen.getByRole('button', { name: 'drama' }))

    // assert
    expect(screen.getByRole('button', { name: 'drama' })).toHaveClass('primary')
    expect(screen.getByTestId('movie-drama')).toBeInTheDocument()
    expect(screen.queryByTestId('movie-comedy')).not.toBeInTheDocument()

    // act
    await user.click(screen.getByRole('button', { name: 'drama' }))

    // assert
    expect(screen.getByRole('button', { name: 'drama' })).toHaveClass('secondary')
    expect(screen.getByTestId('movie-comedy')).toBeInTheDocument()
  })

  it('collapses a section on heading click', async () => {
    // arrange
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([makeMovie()])
    vi.spyOn(api.series, 'getAll').mockResolvedValue([makeSeries()])
    renderHome()
    await flushPromises()

    // act
    await user.click(screen.getByRole('heading', { name: 'Series' }))

    // assert
    expect(screen.queryByTestId('series-series-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('movie-movie-1')).toBeInTheDocument()
  })

  it('shows upcoming items in a separate scheduled section', async () => {
    // arrange
    vi.spyOn(api.series, 'getAll').mockResolvedValue([
      makeSeries({ id: 'soon', title: 'Soon Series', scheduled: Date.now() + 86_400_000 }),
    ])

    // act
    renderHome()
    await flushPromises()

    // assert
    expect(screen.getByRole('heading', { name: 'Scheduled' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Series' })).not.toBeInTheDocument()
    expect(screen.getByTestId('series-soon')).toBeInTheDocument()
    expect(screen.getByTestId('series-soon').closest('a')).toHaveAttribute('href', '/details/series/soon')
  })
})
