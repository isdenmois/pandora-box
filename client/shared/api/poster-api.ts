import type { Movie, Series } from '@/server/domain'
import { http } from './http'

export type { Movie, Series }

const v1 = http.url('/v1/poster')

export const poster = {
  /**
   * Drops the stored file and leaves the path in place, so the next render is a cold miss that
   * downloads again. Resolves with the unchanged row.
   */
  redownload: (id: string) => v1.url(`/${id}`).delete().json<Movie | Series>(),
}
