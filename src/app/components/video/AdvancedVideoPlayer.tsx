'use client';

/* eslint-disable jsx-a11y/role-has-required-aria-props */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  PictureInPicture2,
  Bookmark,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useVideoLazyLoad } from '../../hooks/useVideoLazyLoad';
import { PlaybackControls } from './PlaybackControls';
import { VideoNotes } from './VideoNotes';
import { VideoBookmarks } from './VideoBookmarks';
import { TranscriptView } from './TranscriptView';
import { clamp, formatTime } from '@/utils/videoUtils';
import { usePlaybackAnalytics } from './PlaybackAnalytics';

export type VideoQualityOption = {
  label: string;
  value: string;
  src: string;
  width?: number;
  height?: number;
  bitrate?: number;
};

export type AdvancedVideoPlayerProps = {
  lessonId: string;
  userId?: string;
  src: string; // fallback/default src
  poster?: string;
  qualities?: VideoQualityOption[];
  transcript?: Array<{ time: number; text: string; speaker?: string }>;
  className?: string;
};

export function AdvancedVideoPlayer(props: AdvancedVideoPlayerProps) {
  const { lessonId, userId, src, poster, qualities, transcript = [], className = '' } = props;

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

  const { isInViewport, isLoaded } = useVideoLazyLoad(videoRef, {
    enabled: true,
    threshold: 0.1,
    rootMargin: '50px',
  });

  const [autoQuality, setAutoQuality] = useState(true);
  const initialQualityValue = qualities?.[0]?.value ?? '';
  const [selectedQualityValue, setSelectedQualityValue] = useState<string>(initialQualityValue);

  const activeQualityValue = autoQuality ? 'auto' : selectedQualityValue;
  const activeSrc = useMemo(() => {
    if (!qualities || qualities.length === 0) return src;
    if (autoQuality) return src;
    return qualities.find((q) => q.value === selectedQualityValue)?.src ?? src;
  }, [autoQuality, qualities, selectedQualityValue, src]);

  const qualitiesForControls = useMemo(() => {
    if (!qualities?.length) return undefined;
    return qualities.map((q) => ({
      label: q.label,
      value: q.value,
      width: q.width ?? 0,
      height: q.height ?? 0,
      bitrate: q.bitrate,
    }));
  }, [qualities]);

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
    retry,
    resetError,
    isMuted,
  } = useVideoPlayer(videoRef);

  const analytics = usePlaybackAnalytics({
    lessonId,
    userId,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    qualityValue: activeQualityValue,
  });

  const clampSeekTime = useCallback(
    (time: number) => clamp(time, 0, Number.isFinite(duration) && duration > 0 ? duration : 0),
    [duration],
  );

  const seekToLearning = useCallback(
    (time: number) => {
      const safeTime = clampSeekTime(time);
      analytics.registerSeek(currentTime, safeTime);
      seekTo(safeTime);
    },
    [analytics, clampSeekTime, currentTime, seekTo],
  );

  const setPlaybackRateLearning = useCallback(
    (rate: number) => {
      analytics.registerPlaybackRateChange(rate);
      setPlaybackRate(rate);
    },
    [analytics, setPlaybackRate],
  );

  const setQualityLearning = useCallback(
    (qualityValue: string) => {
      setSelectedQualityValue(qualityValue);
      setAutoQuality(false);
      analytics.registerQualityChange(qualityValue);
    },
    [analytics],
  );

  const setAutoQualityLearning = useCallback(
    (nextAuto: boolean) => {
      setAutoQuality(nextAuto);
      const val = nextAuto ? 'auto' : selectedQualityValue;
      analytics.registerQualityChange(val);
    },
    [analytics, selectedQualityValue],
  );

  // Keep a pending seek when switching quality src (avoid counting it as a user seek).
  const pendingQualitySeekRef = useRef<{ time: number; shouldPlay: boolean } | null>(null);
  useEffect(() => {
    pendingQualitySeekRef.current = { time: currentTime, shouldPlay: isPlaying };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSrc]);

  // Auto-hide controls while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => setShowControls(false), 3000);
    return () => window.clearTimeout(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      setAnnouncement('Video playing');
    } else if (!isPlaying && currentTime > 0) {
      setAnnouncement('Video paused');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Keyboard shortcuts.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) pause();
          else play();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekToLearning(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekToLearning(currentTime + 10);
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
          if (document.pictureInPictureEnabled) void togglePiP();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    currentTime,
    isPlaying,
    pause,
    play,
    seekToLearning,
    setVolume,
    toggleFullscreen,
    toggleMute,
    togglePiP,
    volume,
  ]);

  // Touch gesture handlers (double tap play/pause, swipe seek).
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartTime(Date.now());

    const current = Date.now();
    if (current - lastTapTime < 300) {
      e.preventDefault();
      if (isPlaying) pause();
      else play();
      setLastTapTime(0);
    } else {
      setLastTapTime(current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX;
    const deltaTime = touchEndTime - touchStartTime;

    if (Math.abs(deltaX) > 50 && deltaTime < 500) {
      e.preventDefault();
      const seekAmount = deltaX > 0 ? 10 : -10;
      seekToLearning(clampSeekTime(currentTime + seekAmount));
    }
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center max-w-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Video error</h3>
          <p className="text-red-600 mb-2">{error.message}</p>
          {retryCount < maxRetries ? (
            <button
              onClick={retry}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              type="button"
            >
              Retry
            </button>
          ) : (
            <button
              onClick={resetError}
              className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              type="button"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  }

  const seekBarCurrentWidth = duration > 0 ? `${(currentTime / duration) * 100}%` : '0%';
  const seekBarBufferedWidth = duration > 0 ? `${(buffered / duration) * 100}%` : '0%';

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Advanced video player"
      tabIndex={0}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <video
        ref={videoRef}
        src={isLoaded ? activeSrc : undefined}
        poster={poster}
        preload="metadata"
        className="w-full h-full object-contain"
        onDoubleClick={toggleFullscreen}
        onLoadedMetadata={() => {
          const pending = pendingQualitySeekRef.current;
          if (!pending || !videoRef.current) return;
          const nextTime = pending.time;
          pendingQualitySeekRef.current = null;
          // Apply without counting as user seek.
          seekTo(clampSeekTime(nextTime));
          if (pending.shouldPlay) void play();
        }}
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
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
                  const percentage = rect.width > 0 ? clickX / rect.width : 0;
                  seekToLearning(percentage * duration);
                }}
                role="slider"
                aria-label="Video progress"
                aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    seekToLearning(currentTime - 10);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    seekToLearning(currentTime + 10);
                  }
                }}
              >
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-150"
                  style={{ width: seekBarCurrentWidth }}
                />
                <div
                  className="absolute top-0 h-full bg-white/50 rounded-full transition-all duration-150"
                  style={{ width: seekBarBufferedWidth }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => (isPlaying ? pause() : play())}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors md:p-2"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  type="button"
                >
                  {isPlaying ? (
                    <Pause size={24} className="md:w-5 md:h-5" />
                  ) : (
                    <Play size={24} className="md:w-5 md:h-5" />
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded hover:bg-white/20 transition-colors md:p-1"
                    aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                    type="button"
                  >
                    {isMuted ? (
                      <VolumeX size={20} className="md:w-4 md:h-4" />
                    ) : (
                      <Volume2 size={20} className="md:w-4 md:h-4" />
                    )}
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
                  onClick={() => setShowBookmarks((s) => !s)}
                  className={`p-3 rounded ${
                    showBookmarks ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'
                  } transition-colors md:p-2`}
                  title="Bookmarks"
                  aria-label={showBookmarks ? 'Hide bookmarks panel' : 'Show bookmarks panel'}
                  type="button"
                >
                  <Bookmark size={20} className="md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => setShowTranscript((s) => !s)}
                  className={`p-3 rounded ${
                    showTranscript ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'
                  } transition-colors md:p-2`}
                  title="Transcript"
                  aria-label={showTranscript ? 'Hide transcript panel' : 'Show transcript panel'}
                  type="button"
                >
                  <FileText size={20} className="md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => setShowNotes((s) => !s)}
                  className={`p-3 rounded ${
                    showNotes ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'
                  } transition-colors md:p-2`}
                  title="Notes"
                  aria-label={showNotes ? 'Hide notes panel' : 'Show notes panel'}
                  type="button"
                >
                  <MessageSquare size={20} className="md:w-4 md:h-4" />
                </button>

                {document.pictureInPictureEnabled && (
                  <button
                    onClick={() => void togglePiP()}
                    className={`p-3 rounded ${
                      isPiP ? 'bg-blue-500' : 'bg-white/20 hover:bg-white/30'
                    } transition-colors md:p-2`}
                    title="Picture-in-Picture"
                    aria-label={isPiP ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
                    type="button"
                  >
                    {isPiP ? (
                      <PictureInPicture2 size={20} className="md:w-4 md:h-4" />
                    ) : (
                      <PictureInPicture size={20} className="md:w-4 md:h-4" />
                    )}
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="p-3 rounded bg-white/20 hover:bg-white/30 transition-colors md:p-2"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  type="button"
                >
                  {isFullscreen ? (
                    <Minimize size={20} className="md:w-4 md:h-4" />
                  ) : (
                    <Maximize size={20} className="md:w-4 md:h-4" />
                  )}
                </button>
              </div>
            </div>

            <PlaybackControls
              playbackRate={playbackRate}
              onPlaybackRateChange={setPlaybackRateLearning}
              qualities={qualitiesForControls}
              quality={
                qualitiesForControls ? (autoQuality ? undefined : selectedQualityValue) : undefined
              }
              autoQuality={autoQuality}
              onAutoQualityChange={qualitiesForControls ? setAutoQualityLearning : undefined}
              onQualityChange={qualitiesForControls ? setQualityLearning : undefined}
            />

            <div className="mt-2 text-xs text-white/80 flex items-center justify-between">
              <span>Watched: {Math.round(analytics.snapshot.watchSeconds)}s</span>
              <span>Max progress: {Math.round(analytics.snapshot.maxProgressPercent)}%</span>
            </div>
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
              <VideoBookmarks
                currentTime={currentTime}
                duration={duration}
                lessonId={lessonId}
                userId={userId}
                onSeek={seekToLearning}
                onBookmark={(b) => analytics.registerBookmarkAdded(b.time)}
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
                onSeek={seekToLearning}
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
              <VideoNotes
                currentTime={currentTime}
                lessonId={lessonId}
                userId={userId}
                onNote={(n) => analytics.registerNoteAdded(n.time)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
