import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { OfflineModeProvider } from "./context/OfflineModeContext";
import { OfflineStatusIndicator } from "./components/offline/OfflineStatusIndicator";
import { DownloadManager } from "./components/offline/DownloadManager";
import { StorageManager } from "./components/offline/StorageManager";

const geistSans = Geist({
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
        <ThemeProvider>
          <OfflineModeProvider>
            {children}

            {/* Offline Mode Components */}
            <div className="fixed top-4 right-4 z-50">
              <OfflineStatusIndicator />
            </div>

            <DownloadManager />
            <StorageManager />
          </OfflineModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
