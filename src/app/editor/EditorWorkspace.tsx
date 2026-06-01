'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { sanitizeHtml } from '@/utils/sanitize';

const RichContentEditor = dynamic(
  () => import('@/components/editor/RichContentEditor').then((mod) => mod.RichContentEditor),
  {
    loading: () => (
      <div className="h-[500px] w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    ),
    ssr: false,
  },
);

export function EditorWorkspace() {
  const [content, setContent] = useState('<p>Start editing...</p>');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  return (
    <div className="container mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Advanced Content Editor Demo
        </h1>
        <button
          onClick={() => setIsPreviewMode((prev) => !prev)}
          className={`rounded-lg px-4 py-2 font-medium transition-colors ${
            isPreviewMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isPreviewMode ? 'Back to Editor' : 'Preview'}
        </button>
      </div>

      {isPreviewMode ? (
        <div className="prose prose-lg max-w-none min-h-[calc(100vh-200px)] rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:prose-invert dark:border-gray-700 dark:bg-gray-800">
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
