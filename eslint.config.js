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
      'src/components/assessment/AdaptiveTesting.tsx',
      'src/components/assessment/QuestionTypes.tsx',
      'src/components/collaboration/**',
      'src/hooks/useRealTimeAnalytics.ts',
      'src/hooks/useWebSocket.tsx',
      'src/hooks/useCollaboration.ts',
      'src/hooks/useOfflineSync.ts',
      'src/lib/**',
      'src/middleware/**',
      'src/pages/**',
      'src/store/**',
      'src/utils/pwaUtils.ts',
      'src/utils/web3/**',
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
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      // TypeScript & General Rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      // React Rules
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      // Import Rules
      'import/no-anonymous-default-export': 'off',
      // Prettier Integration
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  // 4. Disable ESLint rules that might conflict with Prettier
  prettierConfig,
];

export default eslintConfig;