import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { httpControllers, imageControllers } from './views'
import { plainBody } from './views/plain-body'

const port = +(process.env.PORT || 3000)

export const app = new Elysia().use(openapi()).use(plainBody).use(httpControllers).use(imageControllers)

if (import.meta.main) {
  app.listen(port, ({ port }) => {
    console.log(`🦊 Elysia is running at :${port}`)
  })
}
