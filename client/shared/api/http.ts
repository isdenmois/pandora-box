import wretch from 'wretch'
import { setAuthState } from '../lib/auth/auth-state'

export const http = wretch('/api') //, { mode: 'cors', credentials: 'include' })
  .errorType('json')
  .catcher(403, () => setAuthState(null))
  .catcher(401, () => setAuthState(null))
