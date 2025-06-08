import { Metadata } from 'next';
import CourseHero from '@/components/courses/CourseHero';
import CourseSyllabus from '@/components/courses/CourseSyllabus';
import InstructorBio from '@/components/courses/InstructorBio';
import EnrollmentCTA from '@/components/courses/EnrollmentCTA';

interface CoursePageProps {
  params: {
    courseId: string;
  };
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  // In a real app, you would fetch course data here
  return {
    title: 'Course Details | TeachLink',
    description: 'View detailed information about this course, including syllabus, instructor details, and enrollment options.',
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <CourseHero />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CourseSyllabus />
            <InstructorBio />
          </div>
          <div className="lg:col-span-1">
            <EnrollmentCTA />
          </div>
        </div>
      </div>
    </div>
  );
} 