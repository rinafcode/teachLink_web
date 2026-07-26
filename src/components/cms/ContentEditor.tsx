'use client';

import React, { useState, useEffect } from 'react';
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Find the lesson in the course structure
  const currentModule = course.modules.find((m) => m.id === moduleId);
  const lesson = currentModule?.lessons.find((l) => l.id === lessonId);

  const handleUpdate = (content: string) => {
    setSaveStatus('saving');
    updateLessonContent(moduleId, lessonId, content);
    
    // Simulate save completion
    setTimeout(() => {
      setLastSaved(new Date());
      setSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500);
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500" role="status">
        Select a lesson to start editing.
      </div>
    );
  }

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'bg-yellow-500';
      case 'saved':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <header className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Editing: <span className="text-blue-500">{lesson.title}</span>
        </h2>
        <div className="flex items-center space-x-2">
          <span 
            aria-live="polite" 
            aria-atomic="true"
            className="text-xs text-gray-400"
          >
            {getStatusText()}
          </span>
          <div 
            className={`w-2 h-2 rounded-full ${getStatusColor()} ${saveStatus === 'saving' ? 'animate-pulse' : ''}`}
            aria-hidden="true"
          />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <RichContentEditor initialContent={lesson.content} onUpdate={handleUpdate} />
      </main>
    </div>
  );
};
