import { t } from 'elysia'

// `t.UnionEnum` injects `default: values[0]`, and Elysia applies params defaults to Bun's
// non-configurable `request.params`, which fails every request with a TypeError. A path param has
// no default anyway: it is either in the URL or the route does not match.
const ProviderSchema = t.Literal('omdb')

export const searchJson = {
  external: {
    params: t.Object({
      provider: ProviderSchema,
    }),
    query: t.Object({
      q: t.String({ minLength: 3 }),
      type: t.Optional(t.String()), // enum always sets movie
      year: t.Optional(t.Number()),
    }),
  },
  byId: {
    params: t.Object({
      provider: ProviderSchema,
      id: t.String(),
    }),
  },
}
