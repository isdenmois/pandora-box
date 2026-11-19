import { env } from '@server/infra/env'
import { createPosterRepository } from './poster.repository'

export const posterRepository = createPosterRepository({
  dir: env.IMAGE_DIR,
  enabled: env.IMAGE_FETCH === 'on',
  maxBytes: env.IMAGE_MAX_BYTES,
})
