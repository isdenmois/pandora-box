import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api'
import { downloadBlob } from '@/shared/lib'
import BackupPage from '../ui/backup-page.vue'

vi.mock('@/shared/lib', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib')>()),
  downloadBlob: vi.fn(),
}))

const user = userEvent.setup()

const renderPage = () => render(BackupPage)

const selectFile = async (content: string) => {
  const file = new File([content], 'backup.json', { type: 'application/json' })

  await user.upload(screen.getByLabelText('File'), file)
}

describe('backup-page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.spyOn(api.admin, 'backupRestore').mockResolvedValue(undefined as never)
  })

  it('creates a backup and downloads it under a timestamped name', async () => {
    // arrange
    const blob = new Blob(['{"movies":[],"series":[]}'], { type: 'application/json' })
    vi.spyOn(api.admin, 'backup').mockResolvedValue(blob)
    renderPage()

    // act
    await user.click(screen.getByRole('button', { name: 'Create Backup' }))
    await flushPromises()

    // assert
    expect(api.admin.backup).toHaveBeenCalledOnce()
    expect(downloadBlob).toHaveBeenCalledOnce()

    const [downloaded, filename] = vi.mocked(downloadBlob).mock.calls[0]!

    expect(downloaded).toBe(blob)
    expect(filename).toMatch(/^box-backup-.*\.json$/)
  })

  it('asks for a file when restoring without one', async () => {
    // arrange
    renderPage()

    // act
    await user.click(screen.getByRole('button', { name: 'Restore backup' }))
    await flushPromises()

    // assert
    expect(screen.getByText('File is not selected')).toBeInTheDocument()
    expect(api.admin.backupRestore).not.toHaveBeenCalled()
  })

  it('rejects a file that is not json', async () => {
    // arrange
    renderPage()
    await selectFile('not json at all')

    // act
    await user.click(screen.getByRole('button', { name: 'Restore backup' }))

    // assert
    expect(await screen.findByText('File is not json')).toBeInTheDocument()
    expect(api.admin.backupRestore).not.toHaveBeenCalled()
  })

  it('rejects json whose values are not arrays', async () => {
    // arrange
    renderPage()
    await selectFile('{"movie":{}}')

    // act
    await user.click(screen.getByRole('button', { name: 'Restore backup' }))

    // assert
    expect(await screen.findByText('Invalid format in backup')).toBeInTheDocument()
    expect(api.admin.backupRestore).not.toHaveBeenCalled()
  })

  it('restores a valid backup', async () => {
    // arrange
    renderPage()
    await selectFile('{"movies":[],"series":[]}')

    // act
    await user.click(screen.getByRole('button', { name: 'Restore backup' }))
    await flushPromises()

    // assert
    expect(api.admin.backupRestore).toHaveBeenCalledExactlyOnceWith({ movies: [], series: [] })
    expect(screen.getByText('Backup successfully restored')).toBeInTheDocument()
  })
})
