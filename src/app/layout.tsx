import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OfflineModeProvider>
          {children}
          
          {/* Offline Mode Components */}
          <div className="fixed top-4 right-4 z-50">
            <OfflineStatusIndicator />
          </div>
          
          <DownloadManager />
          <StorageManager />
        </OfflineModeProvider>
      </body>
    </html>
  );
}
