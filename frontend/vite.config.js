// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // a workaround for CORS issue
      '/api/items': {
        target: 'https://crud-service-217890144082.me-west1.run.app',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/items/, '/items')
      },
      '/api/weather': {
        target: 'https://me-west1-coe558-project-458416.cloudfunctions.net',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/weather/, '/weather')
      },
      '/api/generate': {
        target: 'https://me-west1-coe558-project-458416.cloudfunctions.net',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/generate/, '/generate')
      }
    }
  }
})