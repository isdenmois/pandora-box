import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import { confrimData } from '@/shared/ui/confirm/use-confirm'
import ImagesPage from '../ui/images-page.vue'

const user = userEvent.setup()

const sweepButton = () => screen.getByRole('button', { name: 'Remove orphan images' })

const startSweep = async () => {
  await user.click(sweepButton())

  return confrimData.value
}

describe('images-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    confrimData.value = null
    vi.spyOn(api.admin, 'removeOrphanImages').mockResolvedValue({ removed: 0 })
  })

  it('asks for confirmation before removing orphan images', async () => {
    // arrange
    render(ImagesPage)

    // act
    const confirmation = await startSweep()

    // assert
    expect(confirmation?.title).toBe('Remove orphan images')
    expect(api.admin.removeOrphanImages).not.toHaveBeenCalled()
  })

  it('does not remove anything when the confirmation is cancelled', async () => {
    // arrange
    render(ImagesPage)
    await startSweep()

    // act
    confrimData.value?.resolve(false)
    await flushPromises()

    // assert
    expect(api.admin.removeOrphanImages).not.toHaveBeenCalled()
  })

  it('removes the orphans after confirmation and reports the count', async () => {
    // arrange
    vi.spyOn(api.admin, 'removeOrphanImages').mockResolvedValue({ removed: 3 })
    render(ImagesPage)
    await startSweep()

    // act
    confrimData.value?.resolve(true)
    await flushPromises()

    // assert
    expect(api.admin.removeOrphanImages).toHaveBeenCalledExactlyOnceWith()
    expect(screen.getByText('Removed 3 file(s)')).toBeInTheDocument()
  })

  it('disables the button while the removal is pending', async () => {
    // arrange
    let finishRemoval!: (result: { removed: number }) => void
    const pending = new Promise<{ removed: number }>((resolve) => {
      finishRemoval = resolve
    })
    vi.spyOn(api.admin, 'removeOrphanImages').mockReturnValue(pending)
    render(ImagesPage)
    await startSweep()

    // act
    confrimData.value?.resolve(true)
    await flushPromises()

    // assert
    expect(sweepButton()).toBeDisabled()

    // act
    finishRemoval({ removed: 3 })
    await flushPromises()

    // assert
    expect(sweepButton()).toBeEnabled()
    expect(screen.getByText('Removed 3 file(s)')).toBeInTheDocument()
  })
})
