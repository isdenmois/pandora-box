import type { Movie, Series } from '@/server/domain'
import { http } from './http'

const v1 = http.url('/v1/admin')

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

export const admin = {
  register: (username: string, password: string) => v1.url('/register').post({ username, password }).json(),
  backup: () => v1.url('/backup').get().blob(),
  backupRestore: (data: unknown) => v1.url('/backup').post(data).res(),
  offsiteStatus: () => v1.url('/backup/offsite').get().json<OffsiteStatus>(),
  offsiteUpload: () => v1.url('/backup/offsite').post().json<OffsiteUpload>(),
  import: (data: unknown) => v1.url('/import').post(data).res(),
  importStatus: () => v1.get('/import').json<ImportStatus>(),
  /** Deletes poster files no record references and reports how many were removed. */
  removeOrphanImages: () => v1.url('/images/orphans').delete().json<{ removed: number }>(),
  /** Shared (non-private) rows only; private rows belong to their creator alone. */
  attribution: () => v1.url('/attribution').get().json<AttributionData>(),
  reassignAttribution: (body: AttributionReassign) => v1.url('/attribution').patch(body).json<{ updated: number }>(),
}
