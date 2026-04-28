import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { RootProviders } from '@/providers/RootProviders';

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-50`}
      >
        <RootProviders defaultTheme={defaultTheme}>{children}</RootProviders>

        {/* Non-essential analytics — loaded after page is interactive */}
        {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`}
            strategy="lazyOnload"
          />
        )}
        {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
          <Script id="analytics-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_ANALYTICS_ID}');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
