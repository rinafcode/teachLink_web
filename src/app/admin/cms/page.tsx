'use client';

import React, { useState, useEffect } from 'react';
import { CourseStructureBuilder } from '@/components/cms/CourseStructureBuilder';
import { ContentEditor } from '@/components/cms/ContentEditor';
import { VersionControl } from '@/components/cms/VersionControl';
import { MediaManager } from '@/components/cms/MediaManager';
import { ContentTemplates } from '@/components/cms/ContentTemplates';
import { useCMS } from '@/hooks/useCMS';
import { Save, Eye, Settings, Share2, AlertTriangle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function CMSDashboard() {
  const { course, setCourse } = useCMS();
  const [activeLesson, setActiveLesson] = useState<{ moduleId: string; lessonId: string } | null>(
    null,
  );

  // Initialize with a dummy course if empty
  useEffect(() => {
    if (course.title === '') {
      setCourse({
        id: 'course-1',
        title: 'Mastering Advanced Web Development',
        description: 'A comprehensive guide to modern web technologies.',
        modules: [
          {
            id: 'm1',
            title: 'Getting Started',
            order: 0,
            lessons: [
              {
                id: 'l1',
                title: 'Introduction',
                type: 'video',
                content: '<h1>Welcome!</h1>',
                order: 0,
              },
              {
                id: 'l2',
                title: 'Prerequisites',
                type: 'article',
                content: '<p>You need node.js</p>',
                order: 1,
              },
            ],
          },
        ],
      });
    }
  }, [course.title, setCourse]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 lg:p-8">
      <Toaster position="top-right" />

      {/* Top Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-blue-500">CMS</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">Advanced CMS Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your course content, media, and versions in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-bold text-sm shadow-lg shadow-blue-500/20">
            <Save className="w-4 h-4" />
            Publish Changes
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Left Column: Structure Builder */}
        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden">
            <CourseStructureBuilder />
          </div>
          <div className="h-1/3 overflow-hidden">
            <ContentTemplates />
          </div>
        </div>

        {/* Center Column: Editor */}
        <div className="col-span-12 lg:col-span-6 flex flex-col overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          {course.modules.length > 0 && course.modules[0].lessons.length > 0 ? (
            <ContentEditor
              moduleId={activeLesson?.moduleId || course.modules[0].id}
              lessonId={activeLesson?.lessonId || course.modules[0].lessons[0].id}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
              <p className="text-gray-500">Create a module and lesson to start editing.</p>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar (Version Control & Media) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <VersionControl />
          </div>
          <div className="flex-1 overflow-hidden">
            <MediaManager />
          </div>
        </div>
      </div>
    </div>
  );
}
