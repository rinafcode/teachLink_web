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

/** Legacy files with existing any-typed APIs or unused vars — suppress rules until incrementally remediated */
const LEGACY_DEBT_FILES = [
  'src/form-management/**/*.ts',
  'src/form-management/**/*.tsx',
  'src/app/mobile/**/*.ts',
  'src/app/mobile/**/*.tsx',
  'src/app/components/accessibility/**/*.tsx',
  'src/app/components/messaging/**/*.tsx',
  'src/app/components/notifications/**/*.tsx',
  'src/app/hooks/useNotifications.tsx',
  'src/app/services/offlineSync.ts',
  'src/app/store/notificationStore.ts',
  'src/components/animations/InteractiveAnimations.tsx',
  'src/components/charts/InteractiveChart.tsx',
  'src/components/ConflictResolver.tsx',
  'src/components/dashboard/InteractiveCharts.tsx',
  'src/components/errors/**/*.tsx',
  'src/components/forms/**/*.tsx',
  'src/components/instructor/**/*.tsx',
  'src/components/pwa/OfflineSyncManager.tsx',
  'src/components/search/SearchResultsVisualizer.tsx',
  'src/components/SubscriptionProvider.tsx',
  'src/components/theme/ThemeCustomizer.tsx',
  'src/components/visualization/InteractiveChartLibrary.tsx',
  'src/hooks/useAdvancedForms.tsx',
  'src/hooks/useErrorHandling.tsx',
  'src/hooks/useLazyLoad.tsx',
  'src/hooks/useOfflineMode.tsx',
  'src/hooks/useSubscription.ts',
  'src/hooks/useThemeCustomization.tsx',
  'src/hooks/useWeb3Wallet.ts',
  'src/lib/conflict/resolver.ts',
  'src/lib/db/pool.ts',
  'src/lib/graphql/subscriptions.ts',
  'src/locales/translationManager.ts',
  'src/providers/RootProviders.tsx',
  'src/services/errorReporting.ts',
  'src/services/offlineSync.ts',
  'src/store/devTools.ts',
  'src/store/synchronizationEngine.ts',
  'src/types/cms.ts',
  'src/utils/errorUtils.ts',
  'src/utils/formUtils.ts',
  'src/utils/pwaUtils.ts',
  'src/utils/themeUtils.ts',
  'src/utils/web3/envValidation.ts',
  // Additional files with pre-existing unused vars:
  'src/components/mobile/MobileNavigation.tsx',
  'src/components/profile/ProfileEditForm.tsx',
  'src/components/search/AdvancedSearchInterface.tsx',
  'src/components/subscription/SubscriptionUI.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/ButtonGroup.tsx',
  'src/components/ui/SuspenseLoader.tsx',
  'src/components/ui/Table.tsx',
  'src/components/visualization/DataExplorationTools.tsx',
  'src/components/visualization/RealTimeDataVisualizer.tsx',
  'src/components/web3/DeFiInterface.tsx',
  'src/components/web3/TransactionManager.tsx',
  'src/hooks/useAdvancedSearch.tsx',
  'src/hooks/useCMS.ts',
  'src/hooks/useCollaboration.ts',
  'src/hooks/useInternationalization.tsx',
  'src/hooks/useProfileUpdate.tsx',
  'src/lib/api.ts',
  // Additional directories and pages:
  'src/app/admin/**/*.tsx',
  'src/app/api/**/*.ts',
  'src/app/components/**/*.tsx',
  'src/app/hooks/**/*.tsx',
  'src/app/store/**/*.ts',
  'src/components/assessment/**/*.tsx',
  'src/components/cms/**/*.tsx',
  'src/components/collaboration/**/*.tsx',
  'src/components/courses/**/*.tsx',
  'src/components/i18n/**/*.tsx',
  'src/app/App.tsx',
  'src/app/visualization-demo/page.tsx'
];

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
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      // TypeScript & General Rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      // React Rules
      'react/no-unescaped-entities': 'warn',
      'react/display-name': 'warn',
      // Import Rules
      'import/no-anonymous-default-export': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
      // Prettier Integration
      'prettier/prettier': 'error',
    },
  },
  // 4. Disable ESLint rules that might conflict with Prettier
  prettierConfig,
  // 5. Legacy files — suppress no-explicit-any and no-unused-vars until incrementally remediated
  {
    files: LEGACY_DEBT_FILES,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },
  // 6. Collaboration components use native <img> intentionally for participant avatars
  {
    files: [
      'src/components/collaboration/CollaborativeEditor.tsx',
      'src/components/collaboration/UserPresence.tsx',
    ],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  // 7. Legacy hooks/pages with complex dependency arrays — suppress until audited
  {
    files: [
      'src/components/collaboration/VideoConference.tsx',
      'src/hooks/useCollaboration.ts',
      'src/hooks/useWebSocket.tsx',
      'src/pages/exports/index.tsx',
    ],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // 8. useOfflineSync uses @ts-ignore for an intentional platform shim
  {
    files: ['src/hooks/useOfflineSync.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];

export default eslintConfig;