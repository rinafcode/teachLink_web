import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';
import { sanitizeHtml, sanitizeUrl } from '@/utils/sanitize';

interface UseContentEditorProps {
  initialContent?: string;
  placeholder?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  onUpdate?: (content: string) => void;
}

export const useContentEditor = ({
  initialContent = '',
  placeholder = 'Start writing your content...',
  ariaLabel = 'Post content editor',
  ariaLabelledBy,
  ariaDescribedBy,
  onUpdate,
}: UseContentEditorProps) => {
  const editor = useEditor(
    {
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
          emptyEditorClass:
            'before:content-[attr(data-placeholder)] before:text-gray-400 before:dark:text-gray-500 before:float-left before:h-0 before:pointer-events-none',
        }),
      ],
      immediatelyRender: false,
      content: sanitizeHtml(initialContent),
      onUpdate: ({ editor }) => {
        const html = sanitizeHtml(editor.getHTML());
        if (onUpdate) {
          onUpdate(html);
        }
      },
      // Ensure responsiveness and consistency
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': ariaLabelledBy ? undefined : ariaLabel,
          'aria-labelledby': ariaLabelledBy,
          'aria-describedby': ariaDescribedBy,
          'aria-multiline': 'true',
          'aria-placeholder': placeholder,
          spellcheck: 'true',
          class:
            'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto min-h-[300px] p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
        },
      },
    },
    [initialContent, placeholder, ariaLabel, ariaLabelledBy, ariaDescribedBy, onUpdate],
  ); // Added dependency array

  const addImage = useCallback(
    (url: string) => {
      const safeUrl = sanitizeUrl(url);
      if (safeUrl && editor) {
        editor.chain().focus().setImage({ src: safeUrl }).run();
      }
    },
    [editor],
  );

  const addYoutubeVideo = useCallback(
    (url: string) => {
      const safeUrl = sanitizeUrl(url);
      if (safeUrl && editor) {
        editor.commands.setYoutubeVideo({
          src: safeUrl,
          width: 640,
          height: 480,
        });
      }
    },
    [editor],
  );

  return {
    editor,
    addImage,
    addYoutubeVideo,
  };
};
