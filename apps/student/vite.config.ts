import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '../../'),
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['mammoth', 'pdfjs-dist', 'pdfjs-dist/legacy/build/pdf.mjs'],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      external: ['mammoth', 'pdfjs-dist/legacy/build/pdf.mjs'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) return 'vendor-react';
            if (id.includes('socket.io-client') || id.includes('axios')) return 'vendor-network';
          }
        },
      },
    },
  },
});
