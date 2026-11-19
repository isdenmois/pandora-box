import type { PosterAppType } from '@server/views/http/app-type'
import { createClient } from './client'
import { unwrap } from './request'

const posters = createClient<PosterAppType>('/api/v1/poster')

export const poster = {
  /**
   * Drops the stored file and leaves the path in place, so the next render is a cold miss that
   * downloads again. Resolves with the unchanged poster fields.
   */
  redownload: async (id: string) => unwrap(await posters[':id'].$delete({ param: { id } })),
}
