import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'
import { httpControllers } from './views'

const port = +(process.env.PORT || 3000)

const app = new Elysia().use(openapi()).use(httpControllers)

app.listen(port, ({ port }) => {
  console.log(`🦊 Elysia is running at :${port}`)
})
