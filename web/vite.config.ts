import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import dynamicImport from 'vite-plugin-dynamic-import'

export default defineConfig({
  plugins: [react(), tailwindcss(), dynamicImport()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8088',
    },
  },
})
