import type { UserAppType } from '@server/views/http/app-type'
import { createClient } from './client'
import { unwrap } from './request'

const v1 = createClient<UserAppType>('/api/v1/user')

/** The name directory shape; mirrors the server's sanitized pick. */
export interface UserSummary {
  id: string
  username: string
}

export interface User {
  id: string
  username: string
  role: string | null
}

export const user = {
  current: async () => unwrap(await v1.current.$get()),
  /** Public directory: names only, for attribution labels and the recommender picker. */
  list: async () => unwrap(await v1.index.$get()),
}
