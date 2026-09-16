import { fileURLToPath, URL } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

// Server-side unit tests. Mirrors `server/tsconfig.json` path mapping (`@/*` → `server/*`),
// separate from the client config where `@` points to `client/`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/__tests__/**/*.test.ts'],
    exclude: [...configDefaults.exclude],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
})
