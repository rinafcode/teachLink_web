import type { AppProps } from 'next/app';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/errors/ErrorBoundarySystem';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </ToastProvider>
  );
}
