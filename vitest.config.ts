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
    exclude: ['**/node_modules/**', '**/.next/**', 'e2e/**'],
    coverage: {
      // Use the V8 coverage provider (built into Node — no extra instrumentation).
      provider: 'v8',

      // Only collect coverage for source files inside src/.
      include: ['src/**/*.{ts,tsx}'],

      // Exclude test files, type-only files, and generated/config files.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.d.ts',
        'src/testing/**',
      ],

      // Output formats consumed by CI (LCOV → Codecov, JSON → tooling).
      reporter: ['text', 'lcov', 'json'],

      // Where coverage artefacts are written.
      reportsDirectory: './coverage',

      // Minimum acceptable coverage — CI fails when any threshold is breached.
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
