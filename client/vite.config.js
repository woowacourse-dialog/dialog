import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        headers: {
          Cookie: 'JSESSIONID=E7EFF655FBA9D90268210ED575C5116A',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    exclude: ['**/e2e/**', '**/node_modules/**'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
})
