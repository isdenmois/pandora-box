import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMovies } from '@/entities/movie'
import { api, type MovieView } from '@/shared/api'
import { dateToString } from '@/shared/lib'
import MarkAsViewedDialog from '../mark-as-viewed-dialog.vue'
import { makeMovie } from './fixtures'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
const route = vi.hoisted(() => ({ params: {} as Record<string, string> }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router,
}))

const user = userEvent.setup()

describe('mark-as-viewed-dialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    route.params = {}
  })

  it('renders the form for the route item', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1', title: 'Some Movie' })]
    route.params = { type: 'movie', id: 'm1' }

    // act
    render(MarkAsViewedDialog)
    await flushPromises()

    // assert
    expect(screen.getByTestId('dialog-view')).toBeInTheDocument()
    expect(screen.getByDisplayValue(dateToString(new Date()))).toBeInTheDocument()
    expect(screen.getByText('Rating 0/10')).toBeInTheDocument()
  })

  it('marks the item as viewed and returns to the details page', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1', title: 'Some Movie' })]
    vi.spyOn(api.movie, 'markAsViewed').mockResolvedValue({} as MovieView)
    route.params = { type: 'movie', id: 'm1' }
    render(MarkAsViewedDialog)
    await flushPromises()
    await user.type(screen.getByPlaceholderText('Comment'), 'nice')

    // act
    fireEvent.submit(document.body.querySelector('form')!)
    await flushPromises()

    // assert
    expect(api.movie.markAsViewed).toHaveBeenCalledExactlyOnceWith('m1', dateToString(new Date()), 0, 'nice')
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/details/movie/m1')
  })
})
