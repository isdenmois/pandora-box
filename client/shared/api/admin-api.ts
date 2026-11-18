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

export const admin = {
  register: (username: string, password: string) => v1.url('/register').post({ username, password }).json(),
  backup: () => v1.url('/backup').get().blob(),
  backupRestore: (data: unknown) => v1.url('/backup').post(data).res(),
  import: (data: unknown) => v1.url('/import').post(data).res(),
  importStatus: () => v1.get('/import').json<ImportStatus>(),
  /** Deletes poster files no record references and reports how many were removed. */
  removeOrphanImages: () => v1.url('/images/orphans').delete().json<{ removed: number }>(),
}
