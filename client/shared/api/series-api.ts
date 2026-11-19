import type { SeriesAppType } from '@server/views/http/app-type'
import type { Series, SeriesCreate, SeriesUpdate, SeriesView } from '@/server/entities'
import { createClient } from './client'
import { ensure, unwrap } from './request'

export type { Series, SeriesCreate, SeriesUpdate, SeriesView }

const shows = createClient<SeriesAppType>('/api/v1/series')

export const series = {
  create: async (body: SeriesCreate) => unwrap(await shows.index.$post({ json: body })),
  getAll: async () => unwrap(await shows.index.$get()),
  byId: async (id: string) => unwrap(await shows[':id'].$get({ param: { id } })),
  delete: async (id: string) => {
    await ensure(await shows[':id'].$delete({ param: { id } }))
  },
  // The server returns the stored row, which is how the localized `poster` path reaches the client.
  patch: async (id: string, data: Partial<SeriesUpdate>) =>
    unwrap(await shows[':id'].$patch({ param: { id }, json: data })),
  /** Fields and a picked image file in one request; the file wins over `data.poster`. */
  savePoster: async (id: string, data: Partial<SeriesUpdate>, file: File) =>
    unwrap(
      await shows[':id'].poster.$patch({
        param: { id },
        form: { data: JSON.stringify(data), file },
      }),
    ),
  getViews: async () => unwrap(await shows.views.$get()),
  markAsViewed: async (seriesId: string, date: string, rating: number, comment: string) =>
    unwrap(await shows[':id'].viewed.$post({ param: { id: seriesId }, json: { date, rating, comment } })),
  removeSeriesView: async (seriesId: string) => {
    await ensure(await shows[':id'].view.$delete({ param: { id: seriesId } }))
  },
}
