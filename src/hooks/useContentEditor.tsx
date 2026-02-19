
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useCallback } from 'react';

interface UseContentEditorProps {
  initialContent?: string;
  placeholder?: string;
  onUpdate?: (content: string) => void;
}

export const useContentEditor = ({
  initialContent = '',
  placeholder = 'Start writing your content...',
  onUpdate,
}: UseContentEditorProps) => {
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Youtube.configure({
        width: 640,
        height: 480,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      })
    ],
    immediatelyRender: false,
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onUpdate) {
        onUpdate(html);
      }
    },
    // Ensure responsiveness and consistency
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  const addImage = useCallback((url: string) => {
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYoutubeVideo = useCallback((url: string) => {
    if (url && editor) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  }, [editor]);

  return {
    editor,
    addImage,
    addYoutubeVideo,
  };
};
