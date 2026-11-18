import type { Series, SeriesCreate, SeriesUpdate, SeriesView } from '@/server/entities'
import { http } from './http'

export type { Series, SeriesCreate, SeriesUpdate, SeriesView }

const v1 = http.url('/v1/series')

export const series = {
  create: (body: SeriesCreate) => v1.post(body).json<Series>(),
  getAll: () => v1.get().json<Series[]>(),
  byId: (id: string) => v1.get(`/${id}`).json<Series>(),
  delete: (id: string) => v1.url(`/${id}`).delete().text(),
  // The server returns the stored row, which is how the localized `poster` path reaches the client.
  patch: (id: string, data: Partial<SeriesUpdate>) => v1.url(`/${id}`).patch(data).json<Series>(),
  /** Fields and a picked image file in one request; the file wins over `data.poster`. */
  savePoster: (id: string, data: Partial<SeriesUpdate>, file: File) => {
    const body = new FormData()
    body.append('data', JSON.stringify(data))
    body.append('file', file)

    return v1.url(`/${id}/poster`).patch(body).json<Series>()
  },
  getViews: () => v1.get('/views').json<SeriesView[]>(),
  markAsViewed: (seriesId: string, date: string, rating: number, comment: string) =>
    v1.url(`/${seriesId}/viewed`).post({ date, rating, comment }).json<SeriesView>(),
  removeSeriesView: (seriesId: string) => v1.url(`/${seriesId}/view`).delete().text(),
}
