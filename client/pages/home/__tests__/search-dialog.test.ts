import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { api } from '@/shared/api'
import SearchDialog from '../search-dialog.vue'
import { makeSearchItem } from './fixtures'

const router = vi.hoisted(() => ({ push: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => router,
}))

const RouterLink = defineComponent({
  name: 'RouterLink',
  props: { to: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('a', { href: props.to }, slots.default?.())
  },
})

const user = userEvent.setup()

const renderDialog = () => render(SearchDialog, { global: { components: { RouterLink } } })

const submitSearch = (input: HTMLInputElement) => fireEvent.submit(input.closest('form')!)

describe('search-dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the search dialog', () => {
    // arrange
    // act
    renderDialog()

    // assert
    expect(screen.getByTestId('dialog-search')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Start search by title or id...')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/add/manual')
  })

  it('navigates to the add page when the query is an omdb id', async () => {
    // arrange
    const external = vi.spyOn(api.search, 'external')
    renderDialog()
    const input = screen.getByPlaceholderText('Start search by title or id...')

    // act
    await user.type(input, 'tt1234567')
    submitSearch(input)
    await flushPromises()

    // assert
    expect(router.push).toHaveBeenCalledExactlyOnceWith('/add/tt1234567')
    expect(external).not.toHaveBeenCalled()
  })

  it('shows the results grouped by type', async () => {
    // arrange
    vi.spyOn(api.search, 'external').mockResolvedValue([
      makeSearchItem({ id: 'tt111', title: 'Matrix', type: 'movie' }),
      makeSearchItem({ id: 'tt222', title: 'Lost', type: 'series' }),
    ])
    renderDialog()
    const input = screen.getByPlaceholderText('Start search by title or id...')

    // act
    await user.type(input, 'matrix')
    submitSearch(input)
    await flushPromises()

    // assert
    expect(api.search.external).toHaveBeenCalledExactlyOnceWith('matrix')
    expect(screen.getByRole('heading', { name: 'Series' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument()
    expect(screen.getByTestId('search-movie-tt111')).toHaveAttribute('href', '/add/tt111')
    expect(screen.getByTestId('search-series-tt222')).toHaveAttribute('href', '/add/tt222')
    expect(screen.getByText('Matrix')).toBeInTheDocument()
    expect(screen.getByText('Lost')).toBeInTheDocument()
  })

  it('clears the results when the search fails', async () => {
    // arrange
    vi.spyOn(api.search, 'external').mockRejectedValue(new Error('boom'))
    renderDialog()
    const input = screen.getByPlaceholderText('Start search by title or id...')

    // act
    await user.type(input, 'lost')
    submitSearch(input)
    await flushPromises()

    // assert
    expect(screen.queryByRole('heading', { name: 'Series' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Movies' })).not.toBeInTheDocument()
  })

  it('disables the input while searching', async () => {
    // arrange
    vi.spyOn(api.search, 'external').mockReturnValue(new Promise(() => {}))
    renderDialog()
    const input = screen.getByPlaceholderText('Start search by title or id...')

    // act
    await user.type(input, 'lost')
    submitSearch(input)
    await flushPromises()

    // assert
    expect(input).toBeDisabled()
  })
})
