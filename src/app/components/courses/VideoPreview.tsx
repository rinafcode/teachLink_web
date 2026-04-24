'use client';

import { useState } from 'react';

interface VideoPreviewProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: string;
  onClose?: () => void;
}

export default function VideoPreview({
  videoUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
  thumbnailUrl = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3',
  duration = '5:30',
}: VideoPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative aspect-video w-full overflow-hidden rounded-xl border-2 border-[#E2E8F0] transition-all duration-200 hover:border-[#0066FF] dark:border-[#334155] dark:hover:border-[#00C2FF]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailUrl} alt="Video preview" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition-all duration-200 group-hover:scale-110 group-hover:bg-white">
            <svg className="ml-1 h-8 w-8 text-[#0066FF]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-xs text-white">
          {duration}
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 text-white transition-colors hover:text-[#00C2FF]"
            >
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <video src={videoUrl} controls autoPlay className="aspect-video w-full rounded-xl" />
          </div>
        </div>
      )}
    </>
  );
}
