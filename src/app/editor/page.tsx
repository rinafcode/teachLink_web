
'use client';

import React, { useState } from 'react';
import { RichContentEditor } from '@/components/editor/RichContentEditor';

export default function EditorPage() {
  const [content, setContent] = useState('<p>Start editing...</p>');

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Advanced Content Editor Demo
      </h1>
      
      <div className="mb-8">
        <RichContentEditor
          initialContent={content}
          onUpdate={setContent}
        />
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
          Live Preview (HTML Output)
        </h2>
        <pre className="bg-white dark:bg-gray-800 p-4 rounded overflow-auto h-48 text-sm text-gray-600 dark:text-gray-400 font-mono border border-gray-200 dark:border-gray-700">
          {content}
        </pre>
      </div>
    </div>
  );
}
