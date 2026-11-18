import wretch from 'wretch'
import QueryStringAddon from 'wretch/addons/queryString'
import { useAuth } from '../lib/auth/auth-state'

export const http = wretch('/api')
  .customError(async (error, response) => {
    try {
      return { ...error, json: await response.json() }
    } catch {
      // A proxy or an empty body may not be JSON; the status still has to reach the catchers.
      return error
    }
  })
  .catcher(403, () => useAuth().setUser(null))
  .catcher(401, () => useAuth().setUser(null))
  .addon(QueryStringAddon)
