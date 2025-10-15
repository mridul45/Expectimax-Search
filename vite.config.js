import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwind()],
  base: '/',                 // if deploying under /myapp, set base: '/myapp/'
  build: { outDir: 'dist' }
})
