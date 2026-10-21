import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL ?? ''),
    },
    server: {
      host: true,
      allowedHosts: true,
      proxy: {
        '/socket.io': { target: 'http://localhost:3002', ws: true },
      },
    },
  }
})
