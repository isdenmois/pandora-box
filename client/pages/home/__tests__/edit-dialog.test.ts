import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMovies } from '@/entities/movie'
import { api } from '@/shared/api'
import { confrimData } from '@/shared/ui/confirm/use-confirm'
import EditDialog from '../edit-dialog.vue'
import { makeMovie } from './fixtures'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
const route = vi.hoisted(() => ({ params: {} as Record<string, string> }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router,
}))

const user = userEvent.setup()

describe('edit-dialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    confrimData.value = null
    route.params = {}
  })

  it('renders the edit form for the route item', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1', title: 'Some Movie' })]
    route.params = { type: 'movie', id: 'm1' }

    // act
    render(EditDialog)
    await flushPromises()

    // assert
    expect(screen.getByTestId('dialog-edit')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Title')).toHaveValue('Some Movie')
  })

  it('returns to the details page after saving', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1', title: 'Some Movie' })]
    vi.spyOn(api.movie, 'patch').mockResolvedValue('')
    route.params = { type: 'movie', id: 'm1' }
    render(EditDialog)
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await flushPromises()

    // assert
    expect(api.movie.patch).toHaveBeenCalledExactlyOnceWith('m1', {
      title: 'Some Movie',
      reason: 'because',
      private: false,
      scheduled: null,
      tags: [],
    })
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/details/movie/m1')
  })

  it('returns home after deleting', async () => {
    // arrange
    useMovies().all = [makeMovie({ id: 'm1', title: 'Some Movie' })]
    vi.spyOn(api.movie, 'delete').mockResolvedValue('')
    route.params = { type: 'movie', id: 'm1' }
    render(EditDialog)
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    confrimData.value?.resolve(true)
    await flushPromises()

    // assert
    expect(api.movie.delete).toHaveBeenCalledExactlyOnceWith('m1')
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })
})
