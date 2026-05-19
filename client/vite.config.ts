/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// NOTE: React Compiler is intentionally NOT wired here.
// @vitejs/plugin-react v6 uses Oxc by default and doesn't expose a `babel`
// option the way v4 did; the canonical Vite 8 / Rolldown integration for
// babel-plugin-react-compiler isn't stable as of writing. The package is
// still installed and can be wired once the Vite 8 + plugin-react v6 path
// settles. Until then, manual memoization (which the code base avoids) is
// fine for this demo's scale.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // @ts-expect-error — Vitest config merge isn't picked up by Vite 8's defineConfig types yet.
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: false,
  },
})
