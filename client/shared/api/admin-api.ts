import type { AdminAppType } from '@server/views/http/app-type'
import type { Movie, Series } from '@/server/domain'
import { createClient } from './client'
import { ensure, unwrap, unwrapBlob } from './request'

export interface ImportStatus {
  inProgress: boolean
  movies: {
    finished: number
    total: number
  }
  series: {
    finished: number
    total: number
  }
}

export interface AttributionData {
  movies: Movie[]
  series: Series[]
}

export interface AttributionReassign {
  movies?: string[]
  series?: string[]
  createdBy: string
}

export interface OffsiteStatus {
  /** Retained snapshot keys, newest first. */
  keys: string[]
  retention: number
}

export interface OffsiteUpload {
  key: string
  bytes: number
  pruned: string[]
}

const adminClient = createClient<AdminAppType>('/api/v1/admin')

export const admin = {
  register: async (username: string, password: string) =>
    unwrap(await adminClient.register.$post({ json: { username, password } })),
  backup: async () => unwrapBlob(await adminClient.backup.$get()),
  backupRestore: async (data: unknown) => {
    await ensure(await adminClient.backup.$post({ json: data }))
  },
  offsiteStatus: async () => unwrap(await adminClient.backup.offsite.$get()),
  offsiteUpload: async () => unwrap(await adminClient.backup.offsite.$post()),
  import: async (data: unknown) =>
    unwrap(await adminClient.import.$post({ json: data as { movies: unknown[]; series: unknown[] } })),
  importStatus: async () => unwrap(await adminClient.import.$get()),
  /** Deletes poster files no record references and reports how many were removed. */
  removeOrphanImages: async () => unwrap(await adminClient.images.orphans.$delete()),
  /** Shared (non-private) rows only; private rows belong to their creator alone. */
  attribution: async () => unwrap(await adminClient.attribution.$get()),
  reassignAttribution: async (body: AttributionReassign) =>
    unwrap(await adminClient.attribution.$patch({ json: body })),
}
