'use client';

import React from 'react';
import { RichContentEditor } from '../editor/RichContentEditor';
import { useCMS } from '@/hooks/useCMS';

interface ContentEditorProps {
  moduleId: string;
  lessonId: string;
}

/**
 * Advanced Content Editor for the CMS.
 * Wraps the RichContentEditor and integrates it with the CMS store for auto-saving.
 */
export const ContentEditor: React.FC<ContentEditorProps> = ({ moduleId, lessonId }) => {
  const { course, updateLessonContent } = useCMS();

  // Find the lesson in the course structure
  const currentModule = course.modules.find((m) => m.id === moduleId);
  const lesson = currentModule?.lessons.find((l) => l.id === lessonId);

  const handleUpdate = (content: string) => {
    updateLessonContent(moduleId, lessonId, content);
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a lesson to start editing.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Editing: <span className="text-blue-500">{lesson.title}</span>
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            Last saved: {new Date().toLocaleTimeString()}
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <RichContentEditor initialContent={lesson.content} onUpdate={handleUpdate} />
      </div>
    </div>
  );
};
