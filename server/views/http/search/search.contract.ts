import { t } from 'elysia'

const ProviderSchema = t.UnionEnum(['omdb'])

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
