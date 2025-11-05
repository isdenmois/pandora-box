import { fileURLToPath, URL } from 'node:url'
import presetWind4 from '@unocss/preset-wind4'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

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
    UnoCSS({
      presets: [
        presetWind4({
          preflights: {
            reset: true,
          },
        }),
      ],
      extendTheme: (theme) => ({
        ...theme,
        breakpoint: {
          ...theme.breakpoint,
          zf: '380px',
        },
      }),
    }),
  ],
})
