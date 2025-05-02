import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://coe558-gateway-42vndeds.uc.gateway.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        logLevel: 'debug',
      },
    },
  },
});