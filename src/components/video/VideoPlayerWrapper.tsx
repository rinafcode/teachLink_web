'use client';

import dynamic from 'next/dynamic';
import type { TranscriptCue, VideoSource } from '@/components/video/types';

// Lazy load VideoPlayer to reduce initial bundle (includes video.js + CSS)
const VideoPlayer = dynamic(
  () => import('./VideoPlayer').then((mod) => ({ default: mod.VideoPlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-gray-100 p-3 animate-pulse">
          <div className="w-full h-[560px] bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-gray-500">Loading video player...</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    ),
  },
);

type VideoPlayerWrapperProps = {
  videoId: string;
  userId: string;
  userName: string;
  poster?: string;
  sources: VideoSource[];
  transcript: TranscriptCue[];
};

export function VideoPlayerWrapper(props: VideoPlayerWrapperProps) {
  return <VideoPlayer {...props} />;
}
