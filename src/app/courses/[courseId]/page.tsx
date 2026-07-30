import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CoursePageContent from '../components/CoursePageContent';
import { getCourseById } from '@/lib/course-config';
import type { CourseEntry } from '@/lib/course-config';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (!course) {
    return {
      title: 'Course Not Found | TeachLink',
    };
  }

  return {
    title: `${course.title} | TeachLink`,
    description: course.description,
    openGraph: {
      title: `${course.title} | TeachLink`,
      description: course.description,
      type: 'website',
      siteName: 'TeachLink',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@teachlink',
      title: `${course.title} | TeachLink`,
      description: course.description,
    },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = getCourseById(courseId);

  if (!course) {
    notFound();
  }

  return <CoursePageContent course={course} />;
}
