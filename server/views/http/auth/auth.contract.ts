import * as v from 'valibot'

export const loginBody = v.object({
  username: v.string(),
  password: v.string(),
})

export type LoginBody = v.InferOutput<typeof loginBody>
