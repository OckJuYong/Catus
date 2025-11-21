import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8100,
  },
  // 환경변수는 .env 파일과 Vercel 환경변수에서 자동으로 로드됩니다
})
