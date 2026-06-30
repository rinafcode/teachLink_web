import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
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
      'src/app/(auth)/**',
      'src/app/admin/**',
      'src/app/api/**',
      'src/app/breadcrumbs-demo/**',
      'src/app/certificates/**',
      'src/app/components/**',
      'src/app/dashboard/**',
      'src/app/hooks/**',
      'src/app/layout.tsx',
      'src/app/privacy/**',
      'src/app/release-notes/**',
      'src/app/support/**',
      'src/app/tooltip-demo/**',
      'src/components/**',
      'src/context/**',
      'src/form-management/**',
      'src/hooks/**',
      'src/schemas/**',
      'src/services/**',
      'src/types/**',
      'src/utils/virtualBackgroundUtils.ts',
      'src/workers/**',
      'src/pages/exports/**',
    ],
  },
  // 2. Base Configs (Next.js & TypeScript)
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // 3. Custom Rules and Plugins
  {
    plugins: {
      prettier: prettierPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      // TypeScript & General Rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
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
  // 5. Temporary overrides for legacy files with explicit any type debt
  {
    files: [
      'src/app/mobile/**/*.tsx',
      'src/app/mobile/**/*.ts',
      'src/app/services/offlineSync.ts',
      'src/app/store/notificationStore.ts',
      'src/lib/api.ts',
      'src/lib/conflict/resolver.ts',
      'src/lib/db/pool.ts',
      'src/lib/graphql/subscriptions.ts',
      'src/locales/translationManager.ts',
      'src/providers/RootProviders.tsx',
      'src/store/devTools.ts',
      'src/store/synchronizationEngine.ts',
      'src/utils/errorUtils.ts',
      'src/utils/formUtils.ts',
      'src/utils/themeUtils.ts',
      'src/utils/web3/envValidation.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;
