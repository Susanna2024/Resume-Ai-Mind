import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxy per chiamate API al backend FastAPI
      '/api': {
        target: 'http://127.0.0.1:8000', // URL del tuo backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})