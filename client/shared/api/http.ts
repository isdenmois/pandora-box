import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { setAuthState } from '../lib/auth/auth-state'

export const http = wretch('/api')
  .addon(QueryStringAddon)
  .errorType('json')
  .catcher(403, () => setAuthState(null))
  .catcher(401, () => setAuthState(null))
