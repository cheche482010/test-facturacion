import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  root: process.cwd(),
  // Usa rutas relativas para el build y absolutas para el desarrollo
  base: command === 'build' ? './' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
    fs: {
      // Permite servir archivos desde fuera del espacio de trabajo, soluciona problemas de rutas en Windows.
      strict: false,
    },
  },
}))
