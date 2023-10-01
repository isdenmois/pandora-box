import { tvdbAPI } from '$lib/server/shared/api/tvdb'
import type { PageServerLoad } from './$types'

export const load = (async ({ url }) => {
  const q = url.searchParams.get('q')

  if (q) {
    const series = await tvdbAPI.search(q)

    return { q, series }
  }

  return { q }
}) satisfies PageServerLoad
