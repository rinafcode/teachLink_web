import React, { useEffect, useId, useRef, useState } from 'react'; EditorContent } from '@tiptap/react';
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
  Keyboard,
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
  const editorTitleId = useId();
  const editorDescriptionId = useId();
  const toolbarId = useId();
  const editorRegionId = useId();

  const { editor, addImage, addYoutubeVideo } = useContentEditor({
    initialContent,
    ariaLabelledBy: editorTitleId,
    ariaDescribedBy: `${editorDescriptionId} ${toolbarId}`,
    onUpdate,
  });

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + B: Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      }

      // Ctrl/Cmd + I: Italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }

      // Ctrl/Cmd + U: Underline (if supported)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        editor.chain().focus().toggleStrike().run();
      }

      // Ctrl/Cmd + K: Insert link (placeholder)
     if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Future: Add link insertion dialog
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        editor.chain().focus().undo().run();
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        editor.chain().focus().redo().run();
      }

      // Ctrl/Cmd + Y: Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        editor.chain().focus().redo().run();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={title}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-gray-200 dark:bg-gray-600 text-blue-600' : 'text-gray-600 dark:text-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <section
      aria-labelledby={editorTitleId}
      className="flex h-[calc(100vh-100px)] rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden"
    >
      <div className="flex flex-col flex-1 w-full min-w-0">
{/* Skip to editor link */}
<a
  href="#editor-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to editor content
</a>

<div className="sr-only">
  <h2 id={editorTitleId}>Post editor</h2>
  <p id={editorDescriptionId}>
    Use the formatting toolbar before the editor to style post content. The editor supports
    multiline text, headings, lists, quotes, code blocks, images, and YouTube embeds.
  </p>
</div>

{/* Toolbar */}
<div
  id={toolbarId}
  role="toolbar"
  aria-label="Text formatting"
  aria-controls={editorRegionId}
>
          className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-x-auto"
        >
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough (Ctrl+U)"
            >
              <Strikethrough className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" aria-hidden="true" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" aria-hidden="true" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" aria-hidden="true" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="Code Block"
            >
              <CodeIcon className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Blockquote"
            >
              <Quote className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" aria-hidden="true" />
            <MediaEmbedder onAddImage={addImage} onAddYoutube={addYoutubeVideo} />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" aria-hidden="true" />
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" aria-hidden="true" />
            </ToolbarButton>
          </div>

          <div className="ml-4 flex items-center gap-2">
            <CollaborativeEditingTools />
          </div>
        </nav>

        {/* Editor Content */}
<div
  id={editorRegionId}
  role="region"
  aria-label="Post content editor"
  tabIndex={-1}
  className="flex-1 overflow-y-auto bg-white dark:bg-gray-800"
>
          <EditorContent editor={editor} className="h-full p-8" />
        </div>
      </div>

      {/* Sidebar - Template Library */}
      <ContentTemplateLibrary editor={editor} />
    </section>
  );
};
