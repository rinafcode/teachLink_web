import type { AppProps } from 'next/app';
import { ToastProvider } from '@/context/ToastContext';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}
