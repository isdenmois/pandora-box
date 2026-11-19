import { searchRepository } from '@server/infra'
import { type AppEnv, requireAuth } from '@server/views/auth'
import { Hono } from 'hono'
import { vparam, vquery } from '../validate'
import { searchByIdParams, searchParams, searchQuery } from './search.contract'

export const searchController = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/external/:provider', vparam(searchParams), vquery(searchQuery), async (c) => {
    const { provider } = c.req.valid('param')
    const { q, type, year } = c.req.valid('query')

    return c.json(await searchRepository.search(provider, q, type as 'movie' | 'series' | undefined, year), 200)
  })
  .get('/external/:provider/:id', vparam(searchByIdParams), async (c) => {
    const { provider, id } = c.req.valid('param')

    return c.json(await searchRepository.getById(provider, id), 200)
  })
