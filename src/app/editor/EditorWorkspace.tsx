'use client';

import React, { useId, useState } from 'react';
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
  const workspaceTitleId = useId();
  const editorPanelId = useId();
  const previewPanelId = useId();
  const editorHelpId = useId();
  const liveRegionId = useId();

  return (
    <main aria-labelledby={workspaceTitleId} className="container mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 id={workspaceTitleId} className="text-3xl font-bold text-gray-800 dark:text-white">
            Post Editor
          </h1>
          <p id={editorHelpId} className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Create accessible post content with keyboard-friendly formatting controls and a preview
            mode for reviewing published output.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPreviewMode((prev) => !prev)}
          aria-pressed={isPreviewMode}
          aria-controls={isPreviewMode ? previewPanelId : editorPanelId}
          className={`rounded-lg px-4 py-2 font-medium transition-colors ${
            isPreviewMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {isPreviewMode ? 'Back to Editor' : 'Preview'}
        </button>
      </div>

      <p id={liveRegionId} className="sr-only" aria-live="polite">
        {isPreviewMode ? 'Preview mode is active.' : 'Editor mode is active.'}
      </p>

      {isPreviewMode ? (
        <section
          id={previewPanelId}
          aria-labelledby={workspaceTitleId}
          aria-describedby={editorHelpId}
          className="prose prose-lg max-w-none min-h-[calc(100vh-200px)] rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:prose-invert dark:border-gray-700 dark:bg-gray-800"
        >
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
        </section>
      ) : (
        <section
          id={editorPanelId}
          aria-labelledby={workspaceTitleId}
          aria-describedby={editorHelpId}
          className="mb-8"
        >
          <RichContentEditor initialContent={content} onUpdate={setContent} />
        </section>
      )}
    </main>
  );
}
