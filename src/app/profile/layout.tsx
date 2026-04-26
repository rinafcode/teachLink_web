import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | TeachLink',
  description: 'Manage your TeachLink profile, preferences, and account settings.',
  openGraph: {
    title: 'Profile | TeachLink',
    description: 'Manage your TeachLink profile and account settings.',
    type: 'profile',
  },
  twitter: {
    card: 'summary',
    title: 'Profile | TeachLink',
    description: 'Manage your TeachLink profile and account settings.',
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
