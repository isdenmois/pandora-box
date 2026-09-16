import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import DetailsDialog from '../details-dialog.vue'
import { makeMovie, makeSeries } from './fixtures'

const router = vi.hoisted(() => ({ push: vi.fn() }))
const route = vi.hoisted(() => ({ params: {} as { type?: string; id?: string } }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router,
}))

const user = userEvent.setup()

describe('details-dialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    route.params = {}
  })

  it('renders the movie details for a movie route', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1', title: 'Some Movie' })]
    route.params = { type: 'movie', id: 'm1' }

    // act
    render(DetailsDialog)
    await flushPromises()

    // assert
    expect(screen.getByTestId('dialog-details')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Some Movie' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Finished' })).toBeInTheDocument()
  })

  it('navigates to the edit route when Edit is clicked', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1' })]
    route.params = { type: 'movie', id: 'm1' }
    render(DetailsDialog)
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    // assert
    expect(router.push).toHaveBeenCalledExactlyOnceWith('/edit/movie/m1')
  })

  it('navigates to the seen route when Finished is clicked', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1' })]
    route.params = { type: 'movie', id: 'm1' }
    render(DetailsDialog)
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'Finished' }))

    // assert
    expect(router.push).toHaveBeenCalledExactlyOnceWith('/seen/movie/m1')
  })

  it('renders the series details with the season toggler for a series route', async () => {
    // arrange
    useSeries().all = [makeSeries({ id: 's1', title: 'Some Series', season: 2, extra: { totalSeasons: '5' } })]
    route.params = { type: 'series', id: 's1' }

    // act
    render(DetailsDialog)
    await flushPromises()

    // assert
    expect(screen.getByTestId('dialog-details')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Some Series' })).toBeInTheDocument()
    expect(screen.getByTestId('season-plus')).toBeInTheDocument()
    expect(screen.getByText('of 5')).toBeInTheDocument()
  })
})
