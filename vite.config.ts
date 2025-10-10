import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { presetUno } from 'unocss'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

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
      '@/server': fileURLToPath(new URL('./server/domain', import.meta.url)),
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
