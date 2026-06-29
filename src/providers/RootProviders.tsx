'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@/lib/theme-provider';
import { I18nProvider } from '@/hooks/useInternationalization';
import { InternationalizationEngine } from '@/components/i18n/InternationalizationEngine';
import { CulturalAdaptationManager } from '@/components/i18n/CulturalAdaptationManager';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { RouteChangeAnnouncer } from '@/components/accessibility/RouteChangeAnnouncer';
import { CommandPalette } from '@/components/CommandPalette';
import {
  LegacyStorePreferencesBridge,
  RemoteSettingsSync,
  ThemeFromSettingsBootstrap,
} from '@/components/settings/SettingsOrchestration';
import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';
import { EnvGuard } from '@/components/shared/EnvGuard';
import { FeatureFlagProvider } from '@/components/shared/FeatureFlagProvider';
import { ToastProvider } from '@/context/ToastContext';
import { Loading } from '@/components/ui/Loading';
import i18n from '@/lib/i18n/config';

// 1. Dynamic Imports (Top-level scope)
const OfflineModeProvider = dynamic(
  () => import('@/context/OfflineModeContext').then((mod) => mod.OfflineModeProvider),
  { ssr: false },
);

const PerformanceMonitoringProvider = dynamic(
  () => import('@/hooks/usePerformanceMonitoring').then((mod) => mod.PerformanceMonitoringProvider),
  { ssr: false },
);

const PWAManager = dynamic(
  () => import('@/components/pwa/PWAManager').then((mod) => mod.PWAManager),
  { ssr: false },
);

const StateManagerIntegration = dynamic(
  () => import('@/components/state/StateManagerIntegration'),
  { ssr: false },
);

const PerformanceMonitor = dynamic(() => import('@/components/performance/PerformanceMonitor'), {
  ssr: false,
});

const PrefetchingEngine = dynamic(() => import('@/components/performance/PrefetchingEngine'), {
  ssr: false,
});

const DynamicTheming = dynamic(() => import('@/components/theme/DynamicTheming'), { ssr: false });

interface RootProvidersProps {
  children: React.ReactNode;
  defaultTheme: string;
  defaultLocale?: string;
}

export function RootProviders({
  children,
  defaultTheme,
  defaultLocale = 'en',
}: RootProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <FeatureFlagProvider>
        <I18nProvider>
          <InternationalizationEngine>
            <CulturalAdaptationManager>
              <ThemeProvider defaultTheme={defaultTheme}>
                {/* Bootstrapping settings */}
                <ThemeFromSettingsBootstrap />
                <LegacyStorePreferencesBridge />
                <RemoteSettingsSync />

                <EnvGuard>
                  <AccessibilityProvider pageLabel="TeachLink - main application">
                    <RouteChangeAnnouncer />
                    <CommandPalette />

                    <Suspense fallback={null}>
                      <DynamicTheming />
                      <PerformanceMonitoringProvider>
                        <OfflineModeProvider>
                          <ToastProvider>
                            <PWAManager />
                            <StateManagerIntegration />
                            <PerformanceMonitor />
                            <PrefetchingEngine />

                            <ErrorBoundary>
                              <Suspense fallback={<Loading />}>{children}</Suspense>
                            </ErrorBoundary>
                          </ToastProvider>
                        </OfflineModeProvider>
                      </PerformanceMonitoringProvider>
                    </Suspense>
                  </AccessibilityProvider>
                </EnvGuard>
              </ThemeProvider>
            </CulturalAdaptationManager>
          </InternationalizationEngine>
        </I18nProvider>
      </FeatureFlagProvider>
    </I18nextProvider>
  );
}
