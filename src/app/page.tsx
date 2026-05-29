import type { Metadata } from 'next';
import HomeContent from './components/home/HomeContent';
import { getFeaturedCourses } from '@/lib/course-config';

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
  const featured = getFeaturedCourses(3);
  const featuredCourses = featured.map((course) => ({
    title: course.title,
    subtitle: course.subtitle ?? course.description,
    author: course.author ?? course.instructor,
    progress: course.progress,
    timeRemaining: course.timeRemaining ?? '12h remaining',
    imageUrl: course.thumbnailUrl,
    courseHref: `/courses/${course.id}`,
  }));

  return <HomeContent featuredCourses={featuredCourses} />;
}
