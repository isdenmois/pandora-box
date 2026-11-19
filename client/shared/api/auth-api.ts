import type { AuthAppType } from '@server/views/http/app-type'
import { createClient } from './client'
import { ensure, unwrap } from './request'
import type { User } from './user-api'

const api = createClient<AuthAppType>('/api/auth')

export const auth = {
  login: async (username: string, password: string) => unwrap(await api.login.$post({ json: { username, password } })),

  logout: async () => {
    await ensure(await api.logout.$post())
  },
}

export type { User }
