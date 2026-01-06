import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // Production optimizations
    outDir: 'dist',
    sourcemap: false, // Disable source maps for production (security)
    minify: 'esbuild', // Fast minification
    target: 'es2020', // Modern browsers only
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', 'zod'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
  },
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Listen on all addresses for Docker
  },
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
});
