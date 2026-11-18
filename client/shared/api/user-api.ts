import type { UserSummary } from '@/server/entities'
import { http } from './http'

export interface User {
  id: string
  username: string
  role: string
}

export type { UserSummary }

const v1 = http.url('/v1/user')

export const user = {
  current: () => v1.get('/current').json<User>(),
  /** Public directory: names only, for attribution labels and the recommender picker. */
  list: () => v1.get('').json<UserSummary[]>(),
}
