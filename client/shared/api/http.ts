import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { useAuth } from '../lib/auth/auth-state'

export const http = wretch('/api')
  .customError(async (error, response) => ({ ...error, json: await response.json() }))
  .catcher(403, () => useAuth().setUser(null))
  .catcher(401, () => useAuth().setUser(null))
  .addon(QueryStringAddon)
