'use client';

import { useState } from 'react';

interface Section {
  id: string;
  title: string;
  description: string;
  lessons: {
    id: string;
    title: string;
    duration: string;
    preview?: boolean;
  }[];
}

interface CourseSyllabusProps {
  sections?: Section[];
}

export default function CourseSyllabus({
  sections = [
    {
      id: '1',
      title: 'Introduction to Web Development',
      description: 'Get started with the basics of web development',
      lessons: [
        { id: '1-1', title: 'Welcome to the Course', duration: '10:00', preview: true },
        { id: '1-2', title: 'Setting Up Your Development Environment', duration: '15:00' },
      ],
    },
    {
      id: '2',
      title: 'HTML Fundamentals',
      description: 'Learn the building blocks of web pages',
      lessons: [
        { id: '2-1', title: 'HTML Structure and Elements', duration: '20:00' },
        { id: '2-2', title: 'Forms and Input Types', duration: '25:00' },
      ],
    },
  ],
}: CourseSyllabusProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['1']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-[#E2E8F0] dark:border-[#334155] p-6 lg:p-8 mb-6 lg:mb-8">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-[#0F172A] dark:text-white">Course Syllabus</h2>
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="border border-[#E2E8F0] dark:border-[#334155] rounded-lg overflow-hidden transition-all duration-200">
            <button
              className="w-full px-4 lg:px-6 py-4 text-left flex justify-between items-center hover:bg-[#F8FAFC] dark:hover:bg-[#334155] transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-base lg:text-lg text-[#0F172A] dark:text-white">{section.title}</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">{section.description}</p>
              </div>
              <svg
                className={`w-5 h-5 text-[#64748B] dark:text-[#94A3B8] transition-transform duration-200 ml-4 flex-shrink-0 ${expandedSections.has(section.id) ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            {expandedSections.has(section.id) && (
              <div className="px-4 lg:px-6 py-2 bg-[#F8FAFC] dark:bg-[#0F172A] border-t border-[#E2E8F0] dark:border-[#334155]">
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between py-3 border-b border-[#E2E8F0] dark:border-[#334155] last:border-b-0 group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <svg className="w-5 h-5 text-[#0066FF] dark:text-[#00C2FF] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      <span className="text-sm lg:text-base text-[#0F172A] dark:text-white group-hover:text-[#0066FF] dark:group-hover:text-[#00C2FF] transition-colors">{lesson.title}</span>
                      {lesson.preview && (
                        <span className="text-xs bg-[#DBEAFE] dark:bg-[#1E3A8A] text-[#0066FF] dark:text-[#60A5FA] px-2 py-1 rounded-full font-medium">
                          Preview
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-[#64748B] dark:text-[#94A3B8] ml-4 flex-shrink-0">{lesson.duration}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 