'use client';

import { CourseCreationWizard } from '@/components/instructor/CourseCreationWizard';

export default function CreateCoursePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
        </div>
      </header>

      <main className="py-8">
        <CourseCreationWizard />
      </main>
    </div>
  );
}
