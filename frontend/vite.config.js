import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react()],
    server: {
      proxy: {
        // Any /api/* on localhost:5173 → your real gateway
        '/api': {
          target: env.VITE_API_URL === 'http://localhost:5173'
            // during dev point at your real API gateway:
            ? 'https://coe558-gateway-2s3i5z6a.ew.gateway.dev'
            : undefined,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})