import { http } from './client'

export const admin = {
  register: (username: string, password: string) => http.url('/v1/admin/register').post({ username, password }),
}
