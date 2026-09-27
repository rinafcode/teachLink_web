'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { TranscriptCue } from '@/components/video/types';
import { DUMMY_VIDEO_URL } from '@/constants/media';

// Lazy-load VideoPlayer to reduce initial bundle size
const VideoPlayer = dynamic(
  () =>
    import('@/components/video/VideoPlayerLazy').then((mod) => ({ default: mod.VideoPlayerLazy })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video player...</p>
        </div>
      </div>
    ),
  },
);

const sampleTranscript: TranscriptCue[] = [
  { id: 'cue-1', start: 0, end: 6, text: 'Welcome to the advanced learning module.' },
  { id: 'cue-2', start: 6, end: 14, text: 'This player supports transcript based navigation.' },
  { id: 'cue-3', start: 14, end: 22, text: 'Create bookmarks with thumbnails for quick revision.' },
  {
    id: 'cue-4',
    start: 22,
    end: 31,
    text: 'Share collaborative annotations in real time with peers.',
  },
  {
    id: 'cue-5',
    start: 31,
    end: 40,
    text: 'Adjust playback speed and quality for your learning pace.',
  },
];

export default function VideoPlayerDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Video Player Demo</h1>
          <p className="text-gray-600">
            Try notes, bookmarks, playback speed, and quality switching. Analytics events are posted
            to mock API routes.
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <VideoPlayer
            videoId="demo-lesson-1"
            userId="demo-user-1"
            userName="Demo Student"
            poster="https://via.placeholder.com/1280x720/2563eb/ffffff?text=Advanced+Video+Player"
            sources={[
              {
                label: '1080p HD',
                src: DUMMY_VIDEO_URL,
                type: 'video/youtube',
              },
              {
                label: '720p',
                src: DUMMY_VIDEO_URL,
                type: 'video/youtube',
              },
              {
                label: '480p',
                src: DUMMY_VIDEO_URL,
                type: 'video/youtube',
              },
            ]}
            transcript={sampleTranscript}
          />
        </div>
      </div>
    </div>
  );
}
