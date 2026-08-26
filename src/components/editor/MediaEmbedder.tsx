import React, { useEffect, useId, useRef, useState } from 'react';
import { Image as ImageIcon, Youtube as YoutubeIcon } from 'lucide-react';
import { sanitizeUrl } from '@/utils/sanitize';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface MediaEmbedderProps {
  onAddImage: (url: string, alt?: string) => void;
  onAddYoutube: (url: string) => void;
}

export const MediaEmbedder: React.FC<MediaEmbedderProps> = ({ onAddImage, onAddYoutube }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [type, setType] = useState<'image' | 'youtube'>('image');
  const [urlError, setUrlError] = useState('');
  const id = useId();
  const dialogTitleId = `${id}-title`;
  const errorId = `${id}-error`;
  const inputId = `${id}-url`;
  const altInputId = `${id}-alt`;
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useFocusTrap<HTMLDivElement>(isOpen, { initialFocusRef: urlInputRef });

  const closeDialog = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) setAltText('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) {
      setUrlError('Only http and https URLs are allowed.');
      return;
    }
    setUrlError('');
    if (type === 'image') {
      onAddImage(safeUrl, altText);
    } else {
      onAddYoutube(safeUrl);
    }
    setUrl('');
    setAltText('');
    closeDialog();
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setType('image');
            setIsOpen(true);
          }}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Add image"
          title="Add Image"
        >
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            setType('youtube');
            setIsOpen(true);
          }}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Add YouTube video"
          title="Add YouTube Video"
        >
          <YoutubeIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      {isOpen ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 id={dialogTitleId} className="text-lg font-bold mb-4">
              Add {type === 'image' ? 'Image' : 'YouTube Video'}
            </h3>
            <form onSubmit={handleSubmit}>
              <label htmlFor={inputId} className="sr-only">
                {type === 'image' ? 'Image URL' : 'YouTube video URL'}
              </label>
              <input
                ref={urlInputRef}
                id={inputId}
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder={`Enter ${type} URL...`}
                className="w-full p-2 border rounded mb-1 dark:bg-gray-700 dark:border-gray-600"
                aria-describedby={errorId}
                required
              />
              <p
                id={errorId}
                role="alert"
                aria-live="assertive"
                className="text-red-500 text-sm mb-3 min-h-[1.25rem]"
              >
                {urlError}
              </p>
              {type === 'image' ? (
                <>
                  <label htmlFor={altInputId} className="text-sm text-gray-600 dark:text-gray-300">
                    Alt text (for screen readers)
                  </label>
                  <input
                    id={altInputId}
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image..."
                    className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:border-gray-600"
                  />
                </>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Embed
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
