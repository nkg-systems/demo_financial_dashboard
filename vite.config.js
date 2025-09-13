import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {},
  },
  server: {
    host: true,
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and DOM
          'react-vendor': ['react', 'react-dom'],
          // Vendor chunk for UI libraries
          'ui-vendor': ['lucide-react'],
          // Vendor chunk for data/networking
          'data-vendor': ['axios'],
          // Separate chunk for recharts (large charting library)
          'charts': ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
