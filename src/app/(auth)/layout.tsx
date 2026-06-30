import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TeachLink - Sign In or Create an Account',
  description:
    'Access your TeachLink account to continue learning offline. Sign in, sign up, or verify your email.',
  openGraph: {
    title: 'TeachLink - Sign In or Create an Account',
    description: 'Access your TeachLink account to continue learning.',
    type: 'website',
    siteName: 'TeachLink',
  },
  twitter: {
    card: 'summary',
    site: '@teachlink',
    title: 'TeachLink - Sign In or Create an Account',
    description: 'Access your TeachLink account to continue learning.',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
