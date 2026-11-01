import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Single-deployment build: everything is bundled into static assets.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
  },
})
