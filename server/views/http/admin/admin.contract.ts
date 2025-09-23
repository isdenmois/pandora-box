import { t } from 'elysia'

export const RegisterUserBody = t.Object({
  username: t.String(),
  password: t.String(),
})
