import { backupRepository, OFFSITE_RETENTION, offsiteConfigured, offsiteKey, offsiteRepository } from '@server/infra'
import { errorMessage } from '@server/shared'

export type OffsiteResult =
  | { ok: true; key: string; bytes: number; pruned: string[] }
  | { ok: false; reason: 'not-configured' | 'failed'; message: string }

/**
 * Snapshots the database and pushes it to Realtime Database in one request: the cron has nothing
 * to read back, so a failure is reported rather than retried or parked on disk.
 */
export async function upload(): Promise<OffsiteResult> {
  if (!offsiteConfigured) {
    return { ok: false, reason: 'not-configured', message: 'Offsite backup is not configured' }
  }

  const started = Date.now()
  const key = offsiteKey()

  try {
    const data = await backupRepository.create()
    const bytes = await offsiteRepository.put(key, data)
    // Retention runs after the write and never fails the run: extra keys are harmless and the
    // next backup sweeps them.
    const pruned = await offsiteRepository.prune(OFFSITE_RETENTION).catch((error) => {
      console.error(`offsite backup ${key}: prune failed: ${errorMessage(error)}`)

      return []
    })

    console.info(`offsite backup ${key} uploaded: ${bytes} bytes, ${pruned.length} pruned, ${Date.now() - started}ms`)

    return { ok: true, key, bytes, pruned }
  } catch (error) {
    const message = errorMessage(error)

    console.error(`offsite backup ${key} failed: ${message}`)

    return { ok: false, reason: 'failed', message }
  }
}
