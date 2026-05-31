import type { AppProps } from 'next/app';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';
import { ThemeProvider } from '@/lib/theme-provider';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}
