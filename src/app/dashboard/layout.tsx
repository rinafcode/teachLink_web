import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | TeachLink',
  description: 'Track your learning progress, manage downloaded courses, and continue where you left off.',
  openGraph: {
    title: 'Dashboard | TeachLink',
    description: 'Track your learning progress and continue your courses.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dashboard | TeachLink',
    description: 'Track your learning progress and continue your courses.',
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
