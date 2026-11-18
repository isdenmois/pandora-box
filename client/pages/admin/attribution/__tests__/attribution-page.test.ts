import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import { useUsers } from '@/shared/lib'
import { makeMovie } from '@/shared/ui/__tests__/fixtures'
import { confrimData } from '@/shared/ui/confirm/use-confirm'
import AttributionPage from '../ui/attribution-page.vue'

const user = userEvent.setup()

const sharedMovie = () => makeMovie({ id: 'movie-1', title: 'Some Movie', createdBy: 'user-1', private: false })

describe('attribution-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    confrimData.value = null
    useUsers().all = [
      { id: 'user-1', username: 'me' },
      { id: 'user-2', username: 'other' },
    ]
    vi.spyOn(api.admin, 'attribution').mockResolvedValue({ movies: [sharedMovie()], series: [] })
    vi.spyOn(api.admin, 'reassignAttribution').mockResolvedValue({ updated: 1 })
    vi.spyOn(api.movie, 'getAll').mockResolvedValue([])
    vi.spyOn(api.series, 'getAll').mockResolvedValue([])
  })

  it('lists shared rows and reassigns one from the row select', async () => {
    // arrange
    render(AttributionPage)
    await flushPromises()

    // assert
    expect(screen.getByText('Some Movie')).toBeInTheDocument()
    expect(screen.getByText(/added by me/)).toBeInTheDocument()

    // act
    await user.selectOptions(screen.getByLabelText('Creator for Some Movie'), 'user-2')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await flushPromises()

    // assert
    expect(api.admin.reassignAttribution).toHaveBeenCalledExactlyOnceWith({
      movies: ['movie-1'],
      series: [],
      createdBy: 'user-2',
    })
  })

  it('reassigns the selected rows from the bulk control after confirmation', async () => {
    // arrange
    const { container } = render(AttributionPage)
    await flushPromises()

    // act
    await user.click(screen.getByLabelText('Select Some Movie'))
    await user.selectOptions(container.querySelector('select[name="target"]')!, 'user-2')
    await user.click(screen.getByRole('button', { name: /Reassign selected/ }))

    // assert
    expect(confrimData.value?.title).toBe('Reassign attribution')

    // act
    confrimData.value?.resolve(true)
    await flushPromises()

    // assert
    expect(api.admin.reassignAttribution).toHaveBeenCalledExactlyOnceWith({
      movies: ['movie-1'],
      series: [],
      createdBy: 'user-2',
    })
  })
})
