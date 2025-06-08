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
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="border rounded-lg">
            <button
              className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-50"
              onClick={() => toggleSection(section.id)}
            >
              <div>
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
              <span className="text-gray-500">
                {expandedSections.has(section.id) ? '▼' : '▶'}
              </span>
            </button>
            {expandedSections.has(section.id) && (
              <div className="px-4 py-2 bg-gray-50">
                {section.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center">
                      <span className="mr-2">📹</span>
                      <span>{lesson.title}</span>
                      {lesson.preview && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{lesson.duration}</span>
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