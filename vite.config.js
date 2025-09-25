import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer', import.meta.url))
    }
  },
  server: {
    proxy: {
      // Redirigir las peticiones de /api al servidor backend en el puerto 3001
      '/api': 'http://localhost:3001'
    }
  }
})