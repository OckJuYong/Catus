import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // 👈 이 줄 추가
    port: 8100,
  },
  define: {
    'import.meta.env.VITE_KAKAO_REST_API_KEY': JSON.stringify('3208a92b2ae4ffc746f562b3b4162231'),
    'import.meta.env.VITE_KAKAO_REDIRECT_URI': JSON.stringify('https://catus-frontend-umber.vercel.app/auth/kakao/callback'),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://catus-backend-node-8dunpa2fs-juyongs-projects-ca9f3fd5.vercel.app/api/v1'),
    'import.meta.env.VITE_ENABLE_DEBUG': JSON.stringify('false'),
  }
})

