import { http } from './http'
import type { Series } from '../../../server/domain/entities'

export type { Series }

export type SeriesCreate = Omit<Series, 'id'>

const v1 = http.url('/v1/series')

export const series = {
  create: (body: SeriesCreate) => v1.post(body).json<Series>(),
  getAll: () => v1.get().json<Series[]>(),
}
