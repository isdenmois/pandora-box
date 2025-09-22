import Elysia, { t } from 'elysia'
import { authGuard } from '../auth/guard'
import { SearchProvider } from './types'
import { omdbProvider } from './providers'

const providers = {
  omdb: omdbProvider,
} satisfies Record<string, SearchProvider>

const ProviderSchema = t.UnionEnum(Object.keys(providers) as [Providers])

type Providers = keyof typeof providers

export const searchApi = new Elysia({ prefix: '/v1/search' })
  .use(authGuard)
  .get(
    '/external/:provider',
    ({ params: { provider }, query }) => {
      return providers[provider].search(query.q, query.type as undefined, query.year)
    },
    {
      params: t.Object({
        provider: ProviderSchema,
      }),
      query: t.Object({
        q: t.String({ minLength: 3 }),
        type: t.Optional(t.String()),
        year: t.Optional(t.Number()),
      }),
    },
  )
  .get(
    '/external/:provider/:id',
    ({ params: { provider, id } }) => {
      return providers[provider].getById(id)
    },
    {
      params: t.Object({
        provider: ProviderSchema,
        id: t.String(),
      }),
    },
  )
