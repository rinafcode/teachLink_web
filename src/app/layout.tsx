import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { OfflineModeProvider } from "./context/OfflineModeContext";
import { I18nProvider } from "@/hooks/useInternationalization";
import { InternationalizationEngine } from "@/components/i18n/InternationalizationEngine";
import { CulturalAdaptationManager } from "@/components/i18n/CulturalAdaptationManager";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import PrefetchingEngine from "@/components/performance/PrefetchingEngine";
import StateManagerIntegration from "@/components/state/StateManagerIntegration";

const geistSans = Geist({
// ...
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeachLink - Offline Learning Platform",
  description: "Learn anywhere, anytime with offline capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 transition-colors duration-200`}
      >
        <I18nProvider>
          <InternationalizationEngine>
            <CulturalAdaptationManager>
              <ThemeProvider>
                <OfflineModeProvider>
                  <StateManagerIntegration />
                  <PerformanceMonitor />
                  <PrefetchingEngine />
                  {children}
                </OfflineModeProvider>
              </ThemeProvider>
            </CulturalAdaptationManager>
          </InternationalizationEngine>
        </I18nProvider>
      </body>
    </html>
  );
}
