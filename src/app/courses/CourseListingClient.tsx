'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { CourseListItem } from '../components/courses/VirtualizedCourseList';

const VirtualizedCourseList = dynamic(() => import('../components/courses/VirtualizedCourseList'), {
  loading: () => (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[76px] rounded-lg bg-[#262f40]" />
      ))}
    </div>
  ),
});

const categories = ['All', 'Design', 'Security', 'Engineering', 'Web Development', 'Data Science'];

interface CourseListingClientProps {
  courses: CourseListItem[];
}

export function CourseListingClient({ courses }: CourseListingClientProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(
    () =>
      activeCategory === 'All' ? courses : courses.filter((c) => c.category === activeCategory),
    [courses, activeCategory],
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-[#1e2433] p-4">
        <p className="mb-4 text-sm text-gray-400">
          Showing {filtered.length} of {courses.length} courses
        </p>
        <VirtualizedCourseList courses={filtered} />
      </div>
    </>
  );
}
