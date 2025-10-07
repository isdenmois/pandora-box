import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import UnoCSS from 'unocss/vite'
import { presetUno } from 'unocss'

// https://vite.dev/config/
export default defineConfig({
  root: 'client',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    assetsInlineLimit: 64,
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
    UnoCSS({
      presets: [presetUno({ preflight: false })],
    }),
  ],
})
