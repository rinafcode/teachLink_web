import React from 'react';
import { VideoPlayer } from './components/video/VideoPlayer';

// Sample transcript data
const sampleTranscript = [
  { time: 0, text: "Welcome to this comprehensive tutorial on React development.", speaker: "Instructor" },
  { time: 5, text: "Today we'll be covering advanced concepts that will help you build better applications.", speaker: "Instructor" },
  { time: 12, text: "Let's start with the fundamentals of component architecture.", speaker: "Instructor" },
  { time: 18, text: "Components are the building blocks of React applications.", speaker: "Instructor" },
  { time: 25, text: "They allow us to create reusable pieces of UI that can be composed together.", speaker: "Instructor" },
  { time: 32, text: "Now let's look at some practical examples.", speaker: "Instructor" },
  { time: 40, text: "Here's how you can create a functional component.", speaker: "Instructor" },
  { time: 48, text: "Notice how we use the useState hook to manage local state.", speaker: "Instructor" },
  { time: 55, text: "This is a powerful pattern that React provides for state management.", speaker: "Instructor" },
  { time: 62, text: "Let's move on to more advanced topics like custom hooks.", speaker: "Instructor" },
  { time: 70, text: "Custom hooks allow you to extract component logic into reusable functions.", speaker: "Instructor" },
  { time: 78, text: "This makes your code more modular and easier to test.", speaker: "Instructor" },
  { time: 85, text: "That concludes our tutorial. Thanks for watching!", speaker: "Instructor" }
];

function App() {
  const handleProgress = (progress: number) => {
    console.log('Video progress:', progress);
  };

  const handleBookmark = (bookmark: { time: number; title: string; note?: string }) => {
    console.log('New bookmark:', bookmark);
  };

  const handleNote = (note: { time: number; text: string }) => {
    console.log('New note:', note);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced Video Player Demo
          </h1>
          <p className="text-gray-600">
            A comprehensive video player with learning features including bookmarks, notes, and transcript synchronization.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <VideoPlayer
            src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
            poster="https://via.placeholder.com/1280x720/2563eb/ffffff?text=Video+Player+Demo"
            transcript={sampleTranscript}
            onProgress={handleProgress}
            onBookmark={handleBookmark}
            onNote={handleNote}
            className="w-full aspect-video"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Features</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Custom video controls</li>
              <li>• Playback speed control</li>
              <li>• Picture-in-picture support</li>
              <li>• Fullscreen mode</li>
              <li>• Keyboard shortcuts</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Learning Tools</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Interactive bookmarks</li>
              <li>• Timestamped notes</li>
              <li>• Transcript synchronization</li>
              <li>• Progress tracking</li>
              <li>• Auto-save functionality</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🎨 UI/UX</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Beautiful animations</li>
              <li>• Responsive design</li>
              <li>• Touch-friendly controls</li>
              <li>• Dark/light themes</li>
              <li>• Accessibility features</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Space</span>
              <span className="font-medium">Play/Pause</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">← →</span>
              <span className="font-medium">Seek 10s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">↑ ↓</span>
              <span className="font-medium">Volume</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">F</span>
              <span className="font-medium">Fullscreen</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">M</span>
              <span className="font-medium">Mute</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">P</span>
              <span className="font-medium">PiP Mode</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ctrl+Enter</span>
              <span className="font-medium">Save Note</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 