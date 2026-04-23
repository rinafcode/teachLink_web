import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import DynamicTheming from '@/components/theme/DynamicTheming';
import { OfflineModeProvider } from './context/OfflineModeContext';
import { I18nProvider } from '@/hooks/useInternationalization';
import { InternationalizationEngine } from '@/components/i18n/InternationalizationEngine';
import { CulturalAdaptationManager } from '@/components/i18n/CulturalAdaptationManager';
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';
import { PerformanceMonitoringProvider } from '@/hooks/usePerformanceMonitoring';
import PrefetchingEngine from '@/components/performance/PrefetchingEngine';
import StateManagerIntegration from '@/components/state/StateManagerIntegration';
import { PWAManager } from '@/components/pwa/PWAManager';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';
import { EnvGuard } from '@/components/shared/EnvGuard';
import { Suspense } from 'react';
import Loading from '@/components/ui/Loading';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TeachLink - Offline Learning Platform',
  description: 'Learn anywhere, anytime with offline capabilities',
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme');
  const defaultTheme = themeCookie ? themeCookie.value : 'system';

  const themeScript = `
    (function() {
      try {
        var theme = document.cookie.match(/(?:^|; )theme=([^;]*)/);
        var isDark = false;
        if (theme && theme[1]) {
          if (theme[1] === 'dark') isDark = true;
          else if (theme[1] === 'system') isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors duration-200`}
      >
        <I18nProvider>
          <InternationalizationEngine>
            <CulturalAdaptationManager>
              <ThemeProvider defaultTheme={defaultTheme}>
                <DynamicTheming />
                <EnvGuard>
                  <AccessibilityProvider pageLabel="TeachLink — main application">
                    <PerformanceMonitoringProvider>
                      <OfflineModeProvider>
                        <PWAManager />
                        <StateManagerIntegration />
                        <PerformanceMonitor />
                        <PrefetchingEngine />
                        <ErrorBoundary>
                          <Suspense fallback={<Loading />}>{children}</Suspense>
                        </ErrorBoundary>
                      </OfflineModeProvider>
                    </PerformanceMonitoringProvider>
                  </AccessibilityProvider>
                </EnvGuard>
              </ThemeProvider>
            </CulturalAdaptationManager>
          </InternationalizationEngine>
        </I18nProvider>
      </body>
    </html>
  );
}
