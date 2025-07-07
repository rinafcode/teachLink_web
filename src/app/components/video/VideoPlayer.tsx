import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Bookmark, FileText, MessageSquare } from 'lucide-react';
import { PlaybackControls } from './PlaybackControls';
import { BookmarkManager } from './BookmarkManager';
import { TranscriptView } from './TranscriptView';
import { NotesTaker } from './NotesTaker';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  transcript?: Array<{ time: number; text: string }>;
  onProgress?: (progress: number) => void;
  onBookmark?: (bookmark: { time: number; title: string; note?: string }) => void;
  onNote?: (note: { time: number; text: string }) => void;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  transcript = [],
  onProgress,
  onBookmark,
  onNote,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    buffered,
    isLoading,
    error,
    play,
    pause,
    seekTo,
    setVolume,
    setPlaybackRate,
    toggleMute,
    isMuted
  } = useVideoPlayer(videoRef);

  // Auto-hide controls
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPlaying, showControls]);

  // Progress tracking
  useEffect(() => {
    if (onProgress && duration > 0) {
      onProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration, onProgress]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? pause() : play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, volume, play, pause, seekTo, setVolume, toggleMute, toggleFullscreen]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading video</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
          >
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative h-1 bg-white/30 rounded-full cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = clickX / rect.width;
                seekTo(percentage * duration);
              }}>
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-150"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div 
                  className="absolute top-0 h-full bg-white/50 rounded-full transition-all duration-150"
                  style={{ width: `${(buffered / duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={isPlaying ? pause : play}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-1 rounded hover:bg-white/20 transition-colors"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className={`p-2 rounded ${showBookmarks ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors`}
                  title="Bookmarks"
                >
                  <Bookmark size={16} />
                </button>

                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={`p-2 rounded ${showTranscript ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors`}
                  title="Transcript"
                >
                  <FileText size={16} />
                </button>

                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`p-2 rounded ${showNotes ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors`}
                  title="Notes"
                >
                  <MessageSquare size={16} />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded bg-white/20 hover:bg-white/30 transition-colors"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>

            {/* Playback Controls */}
            <PlaybackControls
              playbackRate={playbackRate}
              onPlaybackRateChange={setPlaybackRate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Panels */}
      <div className="absolute top-0 right-0 h-full flex">
        <AnimatePresence>
          {showBookmarks && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 bg-white shadow-lg"
            >
              <BookmarkManager
                currentTime={currentTime}
                duration={duration}
                onSeek={seekTo}
                onBookmark={onBookmark}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 bg-white shadow-lg"
            >
              <TranscriptView
                transcript={transcript}
                currentTime={currentTime}
                onSeek={seekTo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="w-80 bg-white shadow-lg"
            >
              <NotesTaker
                currentTime={currentTime}
                onNote={onNote}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}; 