import type { Series, SeriesCreate, SeriesView, SeriesUpdate } from '@/server/entities'
import { http } from './http'

export type { Series, SeriesCreate, SeriesView, SeriesUpdate }

const v1 = http.url('/v1/series')

export const series = {
  create: (body: SeriesCreate) => v1.post(body).json<Series>(),
  getAll: () => v1.get().json<Series[]>(),
  byId: (id: string) => v1.get('/' + id).json<Series>(),
  delete: (id: string) =>
    v1
      .url('/' + id)
      .delete()
      .text(),
  update: (id: string, data: SeriesUpdate) =>
    v1
      .url('/' + id)
      .put(data)
      .text(),
  getViews: () => v1.get('/views').json<SeriesView[]>(),
  markAsViewed: (seriesId: string, date: string, rating: number) =>
    v1.url(`/${seriesId}/viewed`).post({ date, rating }).json<SeriesView>(),
  removeSeriesView: (seriesId: string) => v1.url(`/${seriesId}/view`).delete().text(),
}
