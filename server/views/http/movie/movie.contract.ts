import { t } from 'elysia'

export const createMovieBody = t.Object({
  extId: t.String(),
  provider: t.UnionEnum(['omdb']),
  title: t.String({ minLength: 1 }),
  poster: t.Nullable(t.String({ minLength: 1 })),
  year: t.Nullable(t.Integer({ minimum: 1 })),
  rating: t.Nullable(t.Number()),
  language: t.Nullable(t.String()),
  genre: t.Nullable(t.String()),
  reason: t.Nullable(t.String()),
  userId: t.Nullable(t.String()),
  private: t.Boolean(),
  extra: t.Any(),
})

export const updateMovieBody = t.Object({
  title: t.String({ minLength: 1 }),
  poster: t.Nullable(t.String({ minLength: 1 })),
  year: t.Nullable(t.Integer({ minimum: 1 })),
  rating: t.Nullable(t.Number()),
  reason: t.Nullable(t.String()),
  private: t.Boolean(),
})
