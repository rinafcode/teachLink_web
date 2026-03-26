'use client';

import React from 'react';
import { AdvancedVideoPlayer } from '../components/video/AdvancedVideoPlayer';

const sampleTranscript = [
  { time: 0, text: 'Welcome to the lesson.' },
  { time: 5, text: 'This segment introduces the core concept.' },
  { time: 12, text: 'Take notes as you learn key ideas.' },
  { time: 18, text: 'Bookmark moments you want to revisit later.' },
  { time: 28, text: 'Speed up to improve your learning flow.' },
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

        <div className="bg-white rounded-lg shadow p-4">
          <AdvancedVideoPlayer
            lessonId="demo-lesson-1"
            userId="demo-user-1"
            poster="https://via.placeholder.com/1280x720/2563eb/ffffff?text=Advanced+Video+Player"
            src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
            qualities={[
              {
                label: '1080p',
                value: '1080p',
                src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                width: 1920,
                height: 1080,
                bitrate: 5000,
              },
              {
                label: '720p',
                value: '720p',
                src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                width: 1280,
                height: 720,
                bitrate: 2500,
              },
              {
                label: '480p',
                value: '480p',
                src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                width: 854,
                height: 480,
                bitrate: 1000,
              },
            ]}
            transcript={sampleTranscript}
            className="aspect-video"
          />
        </div>
      </div>
    </div>
  );
}
