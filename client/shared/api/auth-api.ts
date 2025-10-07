import { http } from './http'
import { type User } from './user-api'

const api = http.url('/auth')

export const auth = {
  login: (username: string, password: string) => api.post({ username, password }, '/login').json<User>(),

  logout: () => api.post({}, '/logout').text(),
}
