'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { sanitizeHtml } from '@/utils/sanitize';

const RichContentEditor = dynamic(
  () => import('@/components/editor/RichContentEditor').then((mod) => mod.RichContentEditor),
  {
    loading: () => (
      <div className="h-[500px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
    ),
    ssr: false,
  },
);

export default function EditorPage() {
  const [content, setContent] = useState('<p>Start editing...</p>');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Advanced Content Editor Demo
        </h1>
        <button
          onClick={() => setIsPreviewMode((prev) => !prev)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isPreviewMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {isPreviewMode ? 'Back to Editor' : 'Preview'}
        </button>
      </div>

      {isPreviewMode ? (
        <div className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[calc(100vh-200px)]">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
        </div>
      ) : (
        <div className="mb-8">
          <RichContentEditor initialContent={content} onUpdate={setContent} />
        </div>
      )}
    </div>
  );
}
