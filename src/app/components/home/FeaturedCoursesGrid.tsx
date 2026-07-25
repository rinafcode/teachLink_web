'use client';

import CourseCard from '../courses/CourseCard';

interface FeaturedCourseData {
  title: string;
  subtitle: string;
  author: string;
  progress: number;
  timeRemaining: string;
  imageUrl?: string;
  courseHref: string;
}

export function FeaturedCoursesGrid({ courses }: { courses: FeaturedCourseData[] }) {
  return (
    <div
      className="
      grid grid-cols-1
      md:grid-cols-2
      lg:grid-cols-3
      gap-6 xl:gap-8
    "
    >
      {courses.map((course) => (
        <CourseCard key={course.courseHref} {...course} />
      ))}
    </div>
  );
}
