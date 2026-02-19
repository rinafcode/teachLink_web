
import React from 'react';
import { BookOpen, Layout, ListChecks, FileVideo } from 'lucide-react';
import { Editor } from '@tiptap/react';
import { TEMPLATES, insertTemplate } from '@/utils/editorUtils';

interface ContentTemplateLibraryProps {
  editor: Editor | null;
}

export const ContentTemplateLibrary: React.FC<ContentTemplateLibraryProps> = ({ editor }) => {
  if (!editor) return null;

  const getIcon = (id: string) => {
    switch (id) {
      case 'lesson-header': return <BookOpen className="w-4 h-4" />;
      case 'code-block': return <Layout className="w-4 h-4" />;
      case 'quiz-block': return <ListChecks className="w-4 h-4" />;
        case 'video-placeholder': return <FileVideo className="w-4 h-4" />;
      default: return <Layout className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 h-full w-64 hidden lg:block">
      <h3 className="font-semibold text-sm text-gray-500 uppercase mb-4 tracking-wider">
        Templates
      </h3>
      <div className="space-y-2">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => insertTemplate(editor, template.id)}
            className="w-full flex items-center gap-3 p-3 text-left rounded-lg bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors group"
          >
            <div className="text-gray-500 group-hover:text-blue-500">
              {getIcon(template.id)}
            </div>
            <div>
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-gray-400 truncate w-32">
                {template.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
