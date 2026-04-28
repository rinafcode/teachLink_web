import type { AppProps } from 'next/app';
import { RootProviders } from '@/providers/RootProviders';
import '../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RootProviders defaultTheme="system">
      <Component {...pageProps} />
    </RootProviders>
  );
}
