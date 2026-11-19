import { app } from './views/http/app'

const port = +(process.env.PORT || 3000)

export { app }

if (import.meta.main) {
  Bun.serve({ port, fetch: app.fetch })

  console.log(`🔥 Hono is running at :${port}`)
}
