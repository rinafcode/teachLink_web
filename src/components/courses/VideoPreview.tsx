'use client';

import { useState } from 'react';

interface VideoPreviewProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  onClose?: () => void;
}

export default function VideoPreview({
  videoUrl = 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  thumbnailUrl = 'https://static.vecteezy.com/system/resources/previews/053/715/379/non_2x/abstract-green-digital-rain-with-matrix-code-in-futuristic-cyber-background-perfect-for-technology-and-data-themed-visuals-png.png',
  duration = '5:30',
}: VideoPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative w-full aspect-video rounded-xl overflow-hidden border-2 border-[#E2E8F0] dark:border-[#334155] hover:border-[#0066FF] dark:hover:border-[#00C2FF] transition-all duration-200"
      >
        <img
          src={thumbnailUrl}
          alt="Video preview"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#0066FF] ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-[#00C2FF] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe
              src={videoUrl}
              className="w-full aspect-video rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
