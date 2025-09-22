import { http } from './http'

export interface User {
  username: string
  role: string
}

const v1 = http.url('/v1/user')

export const user = {
  current: () => v1.get('/current').json<User>(),
}
