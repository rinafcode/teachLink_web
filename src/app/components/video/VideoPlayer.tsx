import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, PictureInPicture, PictureInPicture2, Settings, Bookmark, FileText, MessageSquare } from 'lucide-react';
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
  const [isPiP, setIsPiP] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    buffered,
    isLoading,
    error,
    retryCount,
    maxRetries,
    play,
    pause,
    seekTo,
    setVolume,
    setPlaybackRate,
    toggleMute,
    isMuted,
    retry,
    resetError
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

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartTime(Date.now());
    
    // Double tap detection for play/pause
    const currentTime = Date.now();
    if (currentTime - lastTapTime < 300) {
      e.preventDefault();
      isPlaying ? pause() : play();
      setLastTapTime(0);
    } else {
      setLastTapTime(currentTime);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while seeking
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndTime = Date.now();
    
    const deltaX = touchEndX - touchStartX;
    const deltaTime = touchEndTime - touchStartTime;
    
    // Swipe detection for seeking (horizontal swipe)
    if (Math.abs(deltaX) > 50 && deltaTime < 500) {
      e.preventDefault();
      const seekAmount = deltaX > 0 ? 10 : -10; // 10 seconds forward/backward
      seekTo(Math.max(0, Math.min(duration, currentTime + seekAmount)));
    }
  };

  // Screen reader announcements
  useEffect(() => {
    if (isPlaying) {
      setAnnouncement('Video playing');
    } else if (!isPlaying && currentTime > 0) {
      setAnnouncement('Video paused');
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isFullscreen) {
      setAnnouncement('Entered fullscreen mode');
    } else if (!isFullscreen && document.fullscreenElement) {
      setAnnouncement('Exited fullscreen mode');
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (isPiP) {
      setAnnouncement('Entered picture-in-picture mode');
    } else if (!isPiP && document.pictureInPictureElement) {
      setAnnouncement('Exited picture-in-picture mode');
    }
  }, [isPiP]);

  // Picture-in-Picture handling
  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  }, []);

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

  // Picture-in-Picture event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [videoRef]);

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
        case 'p':
          e.preventDefault();
          if (document.pictureInPictureEnabled) {
            togglePiP();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, duration, volume, play, pause, seekTo, setVolume, toggleMute, toggleFullscreen]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center max-w-md p-6">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Error</h3>
            <p className="text-red-600 mb-2">{error.message}</p>
            <p className="text-sm text-gray-500 mb-4">
              Error Type: {error.type} • Attempt {retryCount + 1} of {maxRetries + 1}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {retryCount < maxRetries && (
              <button
                onClick={retry}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry ({maxRetries - retryCount} attempts left)
              </button>
            )}
            
            <button
              onClick={resetError}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-400">
            <p>Troubleshooting tips:</p>
            <ul className="mt-2 text-left list-disc list-inside space-y-1">
              {error.type === 'network' && (
                <>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                </>
              )}
              {error.type === 'decode' && (
                <>
                  <li>The video file may be corrupted</li>
                  <li>Try a different browser</li>
                </>
              )}
              {error.type === 'source' && (
                <>
                  <li>Video format may not be supported</li>
                  <li>Contact support for assistance</li>
                </>
              )}
            </ul>
          </div>
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
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Video player"
      tabIndex={0}
    >
      {/* Visually hidden screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onDoubleClick={toggleFullscreen}
        aria-label="Course video content"
        role="img"
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
              <div 
                className="relative h-1 bg-white/30 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  seekTo(percentage * duration);
                }}
                role="slider"
                aria-label="Video progress"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    seekTo(Math.max(0, currentTime - 10));
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    seekTo(Math.min(duration, currentTime + 10));
                  }
                }}
              >
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
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors md:p-2"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <Pause size={24} className="md:w-5 md:h-5" /> : <Play size={24} className="md:w-5 md:h-5" />}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded hover:bg-white/20 transition-colors md:p-1"
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                  >
                    {isMuted ? <VolumeX size={20} className="md:w-4 md:h-4" /> : <Volume2 size={20} className="md:w-4 md:h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                    aria-label="Volume control"
                  />
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className={`p-3 rounded ${showBookmarks ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors md:p-2`}
                  title="Bookmarks"
                  aria-label={showBookmarks ? "Hide bookmarks panel" : "Show bookmarks panel"}
                  aria-expanded={showBookmarks}
                >
                  <Bookmark size={20} className="md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={`p-3 rounded ${showTranscript ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors md:p-2`}
                  title="Transcript"
                  aria-label={showTranscript ? "Hide transcript panel" : "Show transcript panel"}
                  aria-expanded={showTranscript}
                >
                  <FileText size={20} className="md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`p-3 rounded ${showNotes ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors md:p-2`}
                  title="Notes"
                  aria-label={showNotes ? "Hide notes panel" : "Show notes panel"}
                  aria-expanded={showNotes}
                >
                  <MessageSquare size={20} className="md:w-4 md:h-4" />
                </button>

                {document.pictureInPictureEnabled && (
                  <button
                    onClick={togglePiP}
                    className={`p-3 rounded ${isPiP ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'} transition-colors md:p-2`}
                    title="Picture-in-Picture"
                    aria-label={isPiP ? "Exit Picture-in-Picture" : "Enter Picture-in-Picture"}
                  >
                    {isPiP ? <PictureInPicture2 size={20} className="md:w-4 md:h-4" /> : <PictureInPicture size={20} className="md:w-4 md:h-4" />}
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="p-3 rounded bg-white/20 hover:bg-white/30 transition-colors md:p-2"
                  title="Fullscreen"
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize size={20} className="md:w-4 md:h-4" /> : <Maximize size={20} className="md:w-4 md:h-4" />}
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