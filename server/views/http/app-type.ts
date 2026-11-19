import type { ApplyGlobalResponse } from 'hono/client'
import type { ErrorBody } from './error'

/**
 * Type-only entry point for the SPA. Importing `app` here would pull the database into the
 * client bundle, so this module must never emit runtime code.
 *
 * Guards, `onError` and `notFound` answer outside the route handlers, so their statuses are
 * merged back into every endpoint by `ApplyGlobalResponse` or `hc` would not see them.
 */
type GlobalResponses = {
  401: { json: ErrorBody }
  500: { json: ErrorBody }
  503: { json: ErrorBody }
}

type WithGlobal<T> = ApplyGlobalResponse<T, GlobalResponses>

/**
 * One client type per resource, so each API module only names the routes it uses. The type-check
 * cost is dominated by the server graph both shapes pull in, not by this union.
 */
export type AuthAppType = WithGlobal<typeof import('./auth/auth.controller')['authController']>
export type UserAppType = WithGlobal<typeof import('./user/user.controller')['userController']>
export type SearchAppType = WithGlobal<typeof import('./search/search.controller')['searchController']>
export type MovieAppType = WithGlobal<typeof import('./movie/movie.controller')['movieController']>
export type SeriesAppType = WithGlobal<typeof import('./series/series.controller')['seriesController']>
export type PosterAppType = WithGlobal<typeof import('./poster/poster.controller')['posterController']>
export type AdminAppType = WithGlobal<typeof import('./admin/admin.controller')['adminController']>
export type OffsiteAppType = WithGlobal<
  typeof import('./backup-offsite/backup-offsite.controller')['offsiteController']
>

/** The whole app; kept for callers that genuinely need every route. */
export type AppType = WithGlobal<typeof import('./app')['app']>
