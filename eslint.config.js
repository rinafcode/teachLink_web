import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // 1. Global Ignores (Replaces .eslintignore)
  {
    ignores: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
      '**/testing/**',
      '**/form-management/**/*.test.ts',
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
    ],
  },

  // 2. Base Configs (Next.js & TypeScript)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // 3. Custom Rules and Plugins
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // TypeScript & General Rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // React Rules
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',

      // Import Rules
      'import/no-anonymous-default-export': 'off',

      // Prettier Integration
      'prettier/prettier': 'error',
    },
  },

  // 4. Disable ESLint rules that might conflict with Prettier
  prettierConfig,
];

export default eslintConfig;
