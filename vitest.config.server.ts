import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

// Server-side unit tests. Mirrors `server/tsconfig.json` path mapping (`@/*` → `server/*`),
// separate from the client config where `@` points to `client/`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/__tests__/**/*.test.ts'],
    exclude: [...configDefaults.exclude],
    // Vitest 5.1's default forks pool calls `child.channel.unref()`, which Bun does not implement.
    pool: 'threads',
    // The server runs on Bun; `bun:sqlite` lets repository tests use a real migrated database.
    env: {
      DATABASE_URL: ':memory:',
      OMDB_URL: 'https://omdb.test/api',
      // Keep poster writes out of `data/images`; the OS owns the directory.
      IMAGE_DIR: join(tmpdir(), 'pandora-box-test-images'),
    },
    // Every worker shares that one image dir, and the orphan sweep deletes files its own database
    // does not know; a poster written by a parallel file would be swept mid-test.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },
})
