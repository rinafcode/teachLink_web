import type { Metadata } from 'next';
import HomeContent from './components/home/HomeContent';

export const metadata: Metadata = {
  title: 'TeachLink - Offline Learning Platform',
  description:
    'Learn anywhere, anytime with offline capabilities. Access courses, track progress, and study without an internet connection.',
  openGraph: {
    title: 'TeachLink - Offline Learning Platform',
    description: 'Learn anywhere, anytime with offline capabilities.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeachLink - Offline Learning Platform',
    description: 'Learn anywhere, anytime with offline capabilities.',
  },
};

export default function Home() {
  return <HomeContent />;
}
