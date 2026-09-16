import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      exclude: [...configDefaults.exclude, 'e2e/**', 'server/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)
