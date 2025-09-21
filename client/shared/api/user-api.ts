import { http } from './client'

export interface User {
  username: string
  role: string
}

export const user = {
  current: () => http.get('/v1/user/current') as Promise<User>,
}
