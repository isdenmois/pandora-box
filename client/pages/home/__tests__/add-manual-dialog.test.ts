import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import AddManualDialog from '../add-manual-dialog.vue'
import { makeMovie, makeSeries } from './fixtures'

const router = vi.hoisted(() => ({ replace: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

const user = userEvent.setup()

describe('add-manual-dialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders the empty manual add form', () => {
    // arrange
    // act
    render(AddManualDialog)

    // assert
    expect(screen.getByTestId('dialog-add')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Manual add' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Title')).toHaveValue('')
  })

  it('creates a manual movie and returns home on submit', async () => {
    // arrange
    const create = vi.spyOn(api.movie, 'create').mockResolvedValue(makeMovie())
    render(AddManualDialog)
    await user.type(screen.getByPlaceholderText('Title'), 'My Movie')

    // act
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(create).toHaveBeenCalledExactlyOnceWith({
      title: 'My Movie',
      rating: null,
      year: null,
      poster: null,
      reason: '',
      scheduled: null,
      tags: [],
      extId: null,
      provider: 'manual',
      language: null,
      genre: null,
      extra: {},
      userId: null,
      private: false,
    })
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('creates a manual series with the season on submit', async () => {
    // arrange
    const create = vi.spyOn(api.series, 'create').mockResolvedValue(makeSeries())
    render(AddManualDialog)
    await user.click(screen.getByText('Series'))
    await user.type(screen.getByPlaceholderText('Title'), 'My Series')
    await user.click(screen.getByTestId('season-plus'))

    // act
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(create).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ title: 'My Series', provider: 'manual', extId: null, season: 2 }),
    )
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('does not create when the title is empty', async () => {
    // arrange
    const create = vi.spyOn(api.movie, 'create')
    render(AddManualDialog)

    // act
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(create).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
