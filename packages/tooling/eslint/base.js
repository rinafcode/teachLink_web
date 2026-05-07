import { FlatCompat } from '@eslint/eslintrc';
import prettierPlugin from 'eslint-plugin-prettier';

export function createEslintConfig(baseDirectory) {
  const compat = new FlatCompat({
    baseDirectory,
  });

  return [
    {
      ignores: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/testing/**',
        '**/form-management/**/*.test.ts',
        '.next/**',
        'node_modules/**',
        '.eslintignore',
      ],
    },
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
      plugins: {
        prettier: prettierPlugin,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/no-unescaped-entities': 'warn',
        'react/display-name': 'warn',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/no-unsafe-function-type': 'warn',
        '@typescript-eslint/no-unused-expressions': 'warn',
        'prettier/prettier': 'error',
        'import/no-anonymous-default-export': 'off',
      },
    },
  ];
}
