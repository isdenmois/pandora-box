import * as v from 'valibot'

export const RegisterUserBody = v.object({
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(31)),
  password: v.pipe(v.string(), v.minLength(4)),
})

export const BackupRestoreBody = v.unknown()

export const ImportBody = v.object({
  series: v.array(v.any()),
  movies: v.array(v.any()),
})

export const ReassignAttributionBody = v.object({
  movies: v.optional(v.array(v.string())),
  series: v.optional(v.array(v.string())),
  createdBy: v.string(),
})
