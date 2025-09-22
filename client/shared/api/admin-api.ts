import { http } from './http'

const v1 = http.url('/v1/admin')

export const admin = {
  register: (username: string, password: string) => v1.url('/register').post({ username, password }).json(),
}
