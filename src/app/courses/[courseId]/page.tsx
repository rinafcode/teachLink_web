import { Metadata } from 'next';
import CourseHero from '@/components/courses/CourseHero';
import CourseSyllabus from '@/components/courses/CourseSyllabus';
import InstructorBio from '@/components/courses/InstructorBio';
import EnrollmentCTA from '@/components/courses/EnrollmentCTA';
import CourseProgress from '@/components/courses/CourseProgress';
import VideoPreview from '@/components/courses/VideoPreview';
import CourseReviews from '@/components/courses/CourseReviews';

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  await params;
  // In a real app, you would fetch course data here
  return {
    title: 'Course Details | TeachLink',
    description: 'View detailed information about this course, including syllabus, instructor details, and enrollment options.',
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  await params;
  const isEnrolled = true;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A]">
      <CourseHero />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <CourseProgress
              progress={68}
              completedLessons={14}
              totalLessons={20}
              isEnrolled={isEnrolled}
            />

            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8">
              <h3 className="text-xl font-semibold mb-4 text-[#0F172A] dark:text-white">Course Preview</h3>
              <VideoPreview />
            </div>

            <CourseSyllabus />
            <CourseReviews />
            <InstructorBio />
          </div>
          <div className="lg:col-span-4">
            <EnrollmentCTA />
          </div>
        </div>
      </div>
    </div>
  );
} 