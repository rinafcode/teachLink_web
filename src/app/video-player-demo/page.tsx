'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(
  () => import('../components/video/VideoPlayer').then((mod) => mod.VideoPlayer),
  {
    loading: () => (
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
    ),
    ssr: false,
  },
);

export default function VideoPlayerDemo() {
  const mockVideoUrl = 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Lazy-Loaded Video Player Demo
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-8">
        The video player below is loaded dynamically using <code>next/dynamic</code>. This reduces
        the initial JavaScript bundle size by splitting the video player and its dependencies into a
        separate chunk.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <VideoPlayer
          src={mockVideoUrl}
          poster="https://peach.blender.org/wp-content/uploads/bbb-splash.png"
        />
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-blue-800 dark:text-blue-300">
            Performance Benefit
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            By lazy loading the video player, users who don&apos;t watch videos won&apos;t download
            the extra JavaScript required for the player controls and logic.
          </p>
        </div>

        <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h2 className="text-xl font-semibold mb-3 text-green-800 dark:text-green-300">
            Implementation
          </h2>
          <p className="text-sm text-green-700 dark:text-green-400">
            Uses <code>ssr: false</code> to ensure the player only hydrates on the client, avoiding
            potential hydration mismatches with heavy media elements.
          </p>
        </div>
      </div>
    </div>
  );
}
