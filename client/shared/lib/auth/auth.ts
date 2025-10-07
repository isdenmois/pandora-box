import { api } from '../../api'
import { useAuth } from './auth-state'

export const auth = {
  async init() {
    const user = await api.user.current().catch(() => null)

    useAuth().setUser(user)
  },

  async login(username: string, password: string) {
    const user = await api.auth.login(username, password)

    useAuth().setUser(user)
  },

  logout() {
    useAuth().setUser(null)
    api.auth.logout()
  },
}
