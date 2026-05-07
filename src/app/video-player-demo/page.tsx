'use client';

import React from 'react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import type { TranscriptCue } from '@/components/video/types';
import { DUMMY_VIDEO_URL } from '@/constants/media';

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
