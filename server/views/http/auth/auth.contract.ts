import { t } from 'elysia'

export const loginBody = t.Object({
  username: t.String(),
  password: t.String(),
})

export type loginBody = typeof loginBody.static
