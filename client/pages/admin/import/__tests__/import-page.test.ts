import userEvent from '@testing-library/user-event'
import { fireEvent, render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, type ImportStatus } from '@/shared/api'
import ImportPage from '../ui/import-page.vue'

vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  sleep: vi.fn(() => Promise.resolve()),
}))

const user = userEvent.setup()

const idle: ImportStatus = {
  inProgress: false,
  movies: { finished: 0, total: 0 },
  series: { finished: 0, total: 0 },
}

const progress: ImportStatus = {
  inProgress: true,
  movies: { finished: 2, total: 5 },
  series: { finished: 1, total: 3 },
}

const finished: ImportStatus = {
  inProgress: false,
  movies: { finished: 5, total: 5 },
  series: { finished: 3, total: 3 },
}

const jsonInput = () => screen.getByRole('textbox')
const importButton = () => screen.getByRole('button', { name: 'Import' })

describe('import-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(api.admin, 'importStatus').mockResolvedValue(idle)
    vi.spyOn(api.admin, 'import').mockResolvedValue(undefined as never)
  })

  it('loads the import status on mount', async () => {
    // arrange
    // act
    render(ImportPage)
    await flushPromises()

    // assert
    expect(api.admin.importStatus).toHaveBeenCalledExactlyOnceWith()
  })

  it('shows the progress and disables the form until a later poll reports finished', async () => {
    // arrange
    let finishPoll!: (status: ImportStatus) => void
    const pending = new Promise<ImportStatus>((resolve) => {
      finishPoll = resolve
    })
    vi.spyOn(api.admin, 'importStatus').mockResolvedValueOnce(progress).mockReturnValueOnce(pending)
    render(ImportPage)

    // act
    await flushPromises()

    // assert
    expect(screen.getByText('Movies: 2 / 5')).toBeInTheDocument()
    expect(screen.getByText('Series: 1 / 3')).toBeInTheDocument()
    expect(jsonInput()).toBeDisabled()
    expect(importButton()).toBeDisabled()

    // act
    finishPoll(finished)
    await flushPromises()

    // assert
    expect(screen.queryByText('Importing')).not.toBeInTheDocument()
    expect(jsonInput()).toBeEnabled()
    expect(importButton()).toBeEnabled()
  })

  it('imports the parsed json', async () => {
    // arrange
    render(ImportPage)
    await flushPromises()
    fireEvent.update(jsonInput(), '{"movies":[],"series":[]}')

    // act
    await user.click(importButton())
    await flushPromises()

    // assert
    expect(api.admin.import).toHaveBeenCalledExactlyOnceWith({ movies: [], series: [] })
  })

  it('shows a validation error for invalid json', async () => {
    // arrange
    render(ImportPage)
    await flushPromises()
    fireEvent.update(jsonInput(), '{not json')

    // act
    await user.click(importButton())

    // assert
    expect(await screen.findByText(/Invalid JSON/)).toBeInTheDocument()
    expect(api.admin.import).not.toHaveBeenCalled()
  })
})
