import type { Series, SeriesCreate, SeriesUpdate } from '@/server/entities'
import { http } from './http'

export type { Series, SeriesCreate, SeriesUpdate }

const v1 = http.url('/v1/series')

export const series = {
  create: (body: SeriesCreate) => v1.post(body).json<Series>(),
  getAll: () => v1.get().json<Series[]>(),
  byId: (id: string) => v1.get('/' + id).json<Series>(),
  update: (id: string, data: SeriesUpdate) =>
    v1
      .url('/' + id)
      .put(data)
      .text(),
}
