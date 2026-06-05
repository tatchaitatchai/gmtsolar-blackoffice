import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // เรียก /api/* จาก frontend แล้วส่งต่อไป Rust API ที่พอร์ต 8088
    // ทำให้ frontend กับ backend อยู่ origin เดียวกันตอน dev (ไม่ต้องกังวล CORS)
    proxy: {
      '/api': 'http://localhost:8088',
    },
  },
})
