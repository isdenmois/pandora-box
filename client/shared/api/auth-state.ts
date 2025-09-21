import { atom, computed } from 'nanostores'
import type { User } from './user-api'

export const user$ = atom<User | null | undefined>(undefined)

export const initialized = computed(user$, (user) => user !== undefined)
export const isLoggedIn = computed(user$, (user) => user !== null)

export const setAuthState = (user: User | null) => {
  user$.set(user || null)
}
