import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_debugger: true,
          passes: 2
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            'date': ['date-fns']
          }
        }
      }
    }
  }
})
