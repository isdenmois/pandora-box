import Elysia from 'elysia'
import { searchRepository } from '@/infra'
import { authGuard } from '@/views/auth'
import { searchJson } from './search.contract'

export const searchController = new Elysia({
  prefix: '/v1/search',
  detail: {
    tags: ['search'],
  },
})
  .use(authGuard)
  .get(
    '/external/:provider',
    ({ params: { provider }, query }) => {
      return searchRepository.search(provider, query.q, query.type, query.year)
    },
    {
      ...searchJson.external,
      detail: {
        description: 'Search in external provider',
      },
    },
  )
  .get(
    '/external/:provider/:id',
    ({ params: { provider, id } }) => {
      return searchRepository.getById(provider, id)
    },
    searchJson.byId,
  )
