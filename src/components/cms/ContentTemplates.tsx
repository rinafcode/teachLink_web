'use client';

import React from 'react';
import { useCMS } from '@/hooks/useCMS';
import { Layout, Video, FileText, HelpCircle, ArrowRight } from 'lucide-react';

const DUMMY_TEMPLATES = [
  {
    id: 't1',
    name: 'Video Tutorial',
    description: 'Perfect for video-first lessons with supporting notes.',
    icon: Video,
    color: 'bg-red-100 text-red-600',
  },
  {
    id: 't2',
    name: 'In-depth Article',
    description: 'Long-form content with images and pull quotes.',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 't3',
    name: 'Interactive Quiz',
    description: 'Engage students with multiple choice and essay questions.',
    icon: HelpCircle,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 't4',
    name: 'Mixed Content',
    description: 'A combination of text, media, and quick checks.',
    icon: Layout,
    color: 'bg-purple-100 text-purple-600',
  },
];

export const ContentTemplates: React.FC = () => {
  const { templates } = useCMS();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-900">
        <Layout className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Content Templates</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4">
          {DUMMY_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${template.color}`}>
                  <template.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 dark:text-white group-hover:text-purple-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                </div>
                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-purple-500" />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] text-gray-500">
                  Reusable
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] text-gray-500">
                  Multimodal
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-900/30">
        <p className="text-xs text-purple-700 dark:text-purple-300 text-center">
          Drag and drop templates directly into your course structure or editor.
        </p>
      </div>
    </div>
  );
};
