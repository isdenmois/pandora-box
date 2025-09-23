import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import staticPlugin from '@elysiajs/static'
import { Elysia } from 'elysia'
import { httpControllers } from './views'

const port = +(process.env.PORT || 3000)

const app = new Elysia()
  .use(cors())
  .use(openapi())
  .use(
    staticPlugin({
      prefix: '/',
      indexHTML: true,
    }),
  )
  .use(httpControllers)

app.listen(port, ({ port }) => {
  console.log(`🦊 Elysia is running at :${port}`)
})
