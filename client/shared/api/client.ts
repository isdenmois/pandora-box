import wretch from 'wretch'
import { setAuthState } from './auth-state'

export const http = wretch('/api') //, { mode: 'cors', credentials: 'include' })
  .errorType('json')
  .resolve((r) => r.json())
  .catcher(403, () => setAuthState(null))
  .catcher(401, () => setAuthState(null))
