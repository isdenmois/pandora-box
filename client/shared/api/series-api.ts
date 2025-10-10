import type { Series } from '@/server/entities'
import { http } from './http'

export type { Series }
export type SeriesCreate = Omit<Series, 'id'>

const v1 = http.url('/v1/series')

export const series = {
  create: (body: SeriesCreate) => v1.post(body).json<Series>(),
  getAll: () => v1.get().json<Series[]>(),
  byId: (id: string) => v1.get('/' + id).json<Series>(),
}
