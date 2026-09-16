import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import AddDialog from '../add-dialog.vue'
import { makeMovie, makeSearchItemDetails, makeSeries } from './fixtures'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
const route = vi.hoisted(() => ({ params: { id: 'tt123' } }))

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => router,
}))

const user = userEvent.setup()

const findSpinner = (root: ParentNode) =>
  [...root.querySelectorAll('use')].find((use) =>
    ['xlink:href', 'href'].some((name) => use.getAttribute(name)?.includes('spinner')),
  )

describe('add-dialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows a spinner while the details are loading', () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockReturnValue(new Promise(() => {}))

    // act
    render(AddDialog)

    // assert
    expect(screen.getByTestId('dialog-add')).toBeInTheDocument()
    expect(findSpinner(screen.getByTestId('dialog-add'))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument()
  })

  it('shows an error when the details cannot be loaded', async () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockRejectedValue(new Error('boom'))

    // act
    render(AddDialog)
    await flushPromises()

    // assert
    expect(api.search.byId).toHaveBeenCalledExactlyOnceWith('tt123')
    expect(screen.getByText('error!')).toBeInTheDocument()
  })

  it('prefills the form from the fetched details', async () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockResolvedValue(makeSearchItemDetails({ title: 'The Matrix' }))

    // act
    render(AddDialog)
    await flushPromises()

    // assert
    expect(screen.getByPlaceholderText('Title')).toHaveValue('The Matrix')
    expect(screen.getByText('Movie')).toHaveClass('active')
    expect(screen.queryByText('Season')).not.toBeInTheDocument()
  })

  it('creates a movie and returns home on submit', async () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockResolvedValue(makeSearchItemDetails())
    const create = vi.spyOn(api.movie, 'create').mockResolvedValue(makeMovie())
    render(AddDialog)
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(create).toHaveBeenCalledExactlyOnceWith({
      title: 'Some Movie',
      rating: 7.5,
      year: 2020,
      poster: 'http://localhost/poster.jpg',
      reason: '',
      scheduled: null,
      tags: [],
      extId: 'tt123',
      provider: 'omdb',
      language: 'English',
      genre: 'Drama',
      extra: {},
      userId: null,
      private: false,
    })
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('creates a series with the selected season on submit', async () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockResolvedValue(makeSearchItemDetails({ type: 'series' }))
    const create = vi.spyOn(api.series, 'create').mockResolvedValue(makeSeries())
    render(AddDialog)
    await flushPromises()
    await user.click(screen.getByTestId('season-plus'))
    await user.click(screen.getByTestId('season-plus'))

    // act
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(create).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ extId: 'tt123', provider: 'omdb', title: 'Some Movie', season: 3 }),
    )
    expect(router.replace).toHaveBeenCalledExactlyOnceWith('/')
  })

  it('does not create when the title is empty', async () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockResolvedValue(makeSearchItemDetails({ title: '' }))
    const create = vi.spyOn(api.movie, 'create')
    render(AddDialog)
    await flushPromises()

    // act
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(create).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('shows a validation error for an invalid rating', async () => {
    // arrange
    vi.spyOn(api.search, 'byId').mockResolvedValue(makeSearchItemDetails())
    const create = vi.spyOn(api.movie, 'create')
    render(AddDialog)
    await flushPromises()
    await user.click(screen.getByRole('button', { name: 'More' }))
    await user.clear(screen.getByPlaceholderText('Rating'))

    // act
    await user.type(screen.getByPlaceholderText('Rating'), 'abc')
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await flushPromises()

    // assert
    expect(screen.getByText('Should be a valid number')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })
})
