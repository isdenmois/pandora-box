import { onMount } from 'nanostores'
import { api } from '../../api'
import { setAuthState, user$ } from './auth-state'

export const auth = {
  async init() {
    const user = await api.user.current().catch(() => null)

    setAuthState(user)
  },

  async login(username: string, password: string) {
    const user = await api.auth.login(username, password)

    setAuthState(user)
  },

  logout() {
    setAuthState(null)
    api.auth.logout()
  },
}

onMount(user$, () => {
  auth.init()
})
