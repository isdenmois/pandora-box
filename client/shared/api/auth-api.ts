import { initialized, isLoggedIn, setAuthState } from './auth-state'
import { http } from './client'
import { user as userApi, type User } from './user-api'

export const auth = {
  init: async () => {
    const user = await userApi.current().catch(() => null)

    setAuthState(user)
  },

  async login(username: string, password: string) {
    const user = (await http.post({ username, password }, '/auth/login')) as User

    console.log('logged in user', user)

    setAuthState(user)
  },

  logout() {
    setAuthState(null)
    http.post({}, '/auth/logout')
  },

  initialized,
  isLoggedIn,
}
