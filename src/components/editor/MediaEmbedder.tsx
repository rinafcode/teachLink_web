
import React, { useState } from 'react';
import { Image as ImageIcon, Youtube as YoutubeIcon, Link as LinkIcon } from 'lucide-react';

interface MediaEmbedderProps {
  onAddImage: (url: string) => void;
  onAddYoutube: (url: string) => void;
}

export const MediaEmbedder: React.FC<MediaEmbedderProps> = ({ onAddImage, onAddYoutube }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'image' | 'youtube'>('image');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'image') {
      onAddImage(url);
    } else {
      onAddYoutube(url);
    }
    setUrl('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => { setType('image'); setIsOpen(true); }}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Add Image"
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setType('youtube'); setIsOpen(true); }}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Add YouTube Video"
        >
          <YoutubeIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">
          Add {type === 'image' ? 'Image' : 'YouTube Video'}
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`Enter ${type} URL...`}
            className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
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
  );
};
