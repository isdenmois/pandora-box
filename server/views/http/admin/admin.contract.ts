import { t } from 'elysia'

export const RegisterUserBody = t.Object({
  username: t.String({ minLength: 3, maxLength: 31 }),
  password: t.String({ minLength: 4 }),
})

export const BackupRestoreBody = t.Any({})

export const ImportBody = t.Object({
  series: t.Array(t.Any()),
  movies: t.Array(t.Any()),
})
