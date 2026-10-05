import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
    // The main bundle carries the product catalogue (~160 kB gzipped); the receipt PDF
    // library is split out and loaded only on "Download PDF".
    chunkSizeWarningLimit: 700,
  },
  preview: {
    port: 4173,
  },
})
