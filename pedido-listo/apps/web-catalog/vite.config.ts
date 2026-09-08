import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pedido-listo/types': path.resolve(__dirname, '../../packages/types/src'),
      '@pedido-listo/whatsapp': path.resolve(__dirname, '../../packages/whatsapp/src'),
      '@pedido-listo/firebase': path.resolve(__dirname, '../../packages/firebase/src'),
    },
  },
})
