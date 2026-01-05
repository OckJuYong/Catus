import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
    port: 8100,
  },
  build: {
    // 빌드마다 고유한 해시 생성 (자동 캐시 무효화)
    rollupOptions: {
      output: {
        // 파일명에 해시 추가 (app.[hash].js)
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  // 환경변수는 .env 파일과 Vercel 환경변수에서 자동으로 로드됩니다
})
