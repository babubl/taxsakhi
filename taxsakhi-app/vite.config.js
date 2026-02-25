import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/taxsakhi/',  // Your GitHub repo name
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
