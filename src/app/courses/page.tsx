import type { Metadata } from 'next';
import { getAllCourses } from '@/lib/course-config';
import { CourseListingClient } from './CourseListingClient';

export const metadata: Metadata = {
  title: 'Courses - TeachLink',
  description: 'Browse all available courses on TeachLink.',
};

export default function CoursesPage() {
  const courses = getAllCourses();

  const mapped = courses.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle ?? c.description,
    instructor: c.instructor,
    progress: c.progress,
    category: c.category,
    thumbnailUrl: c.thumbnailUrl,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="mb-2 text-3xl font-bold">All Courses</h1>
        <p className="mb-8 text-gray-400">
          Browse our complete catalog of {courses.length} courses.
        </p>
        <CourseListingClient courses={mapped} />
      </div>
    </div>
  );
}
