
import React from 'react';
import { EditorContent } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code as CodeIcon,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { useContentEditor } from '@/hooks/useContentEditor';
import { MediaEmbedder } from './MediaEmbedder';
import { CollaborativeEditingTools } from './CollaborativeEditingTools';
import { ContentTemplateLibrary } from './ContentTemplateLibrary';

interface RichContentEditorProps {
  initialContent?: string;
  onUpdate?: (content: string) => void;
}

export const RichContentEditor: React.FC<RichContentEditorProps> = ({
  initialContent,
  onUpdate,
}) => {
  const { editor, addImage, addYoutubeVideo } = useContentEditor({
    initialContent,
    onUpdate,
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-col flex-1 w-full min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strike"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
             <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="Code Block"
            >
              <CodeIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
            <MediaEmbedder onAddImage={addImage} onAddYoutube={addYoutubeVideo} />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
             <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>
          
          <div className="ml-4">
             <CollaborativeEditingTools />
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
           <EditorContent editor={editor} className="h-full p-8" />
        </div>
      </div>

      {/* Sidebar - Template Library */}
      <ContentTemplateLibrary editor={editor} />
    </div>
  );
};
