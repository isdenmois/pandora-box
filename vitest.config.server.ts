import { fileURLToPath, URL } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

// Server-side unit tests. Mirrors `server/tsconfig.json` path mapping (`@/*` → `server/*`),
// separate from the client config where `@` points to `client/`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/__tests__/**/*.test.ts'],
    exclude: [...configDefaults.exclude],
    // The server runs on Bun; `bun:sqlite` lets repository tests use a real migrated database.
    env: {
      DATABASE_URL: ':memory:',
      OMDB_URL: 'https://omdb.test/api',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
})
