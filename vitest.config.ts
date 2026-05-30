import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [], // empty: skip PostCSS entirely in test runs
    },
  },
  test: {
    environment: 'jsdom',
    globalSetup: [],
    setupFiles: ['./src/testing/test-setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/.next/**'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
