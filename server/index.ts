import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import staticPlugin from '@elysiajs/static'
import { Elysia } from 'elysia'
import { adminApi } from './modules/admin'
import { auth } from './modules/auth'
import { userApi } from './modules/user'
import { searchApi } from './modules/search'

const port = +(process.env.PORT || 3000)

const app = new Elysia()
  .use(cors())
  .use(openapi())
  .use(staticPlugin({ prefix: '/' }))
  .group('/api', (r) => r.use(auth).use(userApi).use(adminApi).use(searchApi))

app.listen(port, ({ port }) => {
  console.log(`🦊 Elysia is running at :${port}`)
})
