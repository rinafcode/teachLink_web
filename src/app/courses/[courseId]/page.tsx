import { Metadata } from 'next';
import CoursePageContent from '../components/CoursePageContent';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  await params;
  // In a real app, you would fetch course data here
  return {
    title: 'Course Details | TeachLink',
    description:
      'View detailed information about this course, including syllabus, instructor details, and enrollment options.',
    openGraph: {
      title: 'Course Details | TeachLink',
      description: 'View course syllabus, instructor details, and enrollment options.',
      type: 'website',
      siteName: 'TeachLink',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@teachlink',
      title: 'Course Details | TeachLink',
      description: 'View course syllabus, instructor details, and enrollment options.',
    },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  await params;
  return <CoursePageContent />;
}
