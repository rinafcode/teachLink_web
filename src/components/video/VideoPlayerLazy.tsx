'use client';

import { useEffect, useRef, useState } from 'react';
import { Expand, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { BookmarkSystem } from '@/components/video/BookmarkSystem';
import { CollaborativeAnnotations } from '@/components/video/CollaborativeAnnotations';
import { InteractiveTranscript } from '@/components/video/InteractiveTranscript';
import { VIDEO_KEYBOARD_SHORTCUTS, VIDEO_PLAYBACK_RATES } from '@/components/video/constants';
import type { TranscriptCue, VideoSource } from '@/components/video/types';
import { useVideoPlayerLazy } from '@/hooks/useVideoPlayerLazy';
import {
  formatVideoTime,
  getProgressPercent,
  getSeekTimeWithStep,
  clampSeekTime,
} from '@/utils/videoPlayerUtils';

type VideoPlayerProps = {
  videoId: string;
  userId: string;
  userName: string;
  poster?: string;
  sources: VideoSource[];
  transcript: TranscriptCue[];
};

export function VideoPlayerLazy({
  videoId,
  userId,
  userName,
  poster,
  sources,
  transcript,
}: VideoPlayerProps) {
  const [cssLoaded, setCssLoaded] = useState(false);

  // Dynamically load video.js CSS
  useEffect(() => {
    if (cssLoaded) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/video.js@8.23.7/dist/video-js.min.css';
    link.onload = () => setCssLoaded(true);
    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [cssLoaded]);

  const {
    videoElementRef,
    playerRef,
    currentTime,
    duration,
    isPlaying,
    volume,
    isMuted,
    playbackRate,
    qualityLabel,
    playPause,
    seekTo,
    setVolume,
    toggleMute,
    setPlaybackRate,
    setQuality,
    isReady,
  } = useVideoPlayerLazy({ sources, poster });

  const [activePanel, setActivePanel] = useState<'transcript' | 'bookmarks' | 'annotations'>(
    'transcript',
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const videoAreaRef = useRef<HTMLDivElement | null>(null);
  const progress = getProgressPercent(currentTime, duration);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('keydown', onEscape);
      document.body.style.overflow = previous;
    };
  }, [isExpanded]);

  useEffect(() => {
    const player = playerRef.current;
    const frame = videoAreaRef.current;
    if (!player || !frame) {
      return;
    }
    const sync = () => {
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      if (width > 0 && height > 0) {
        player.dimensions(width, height);
        player.trigger('resize');
      }
    };
    sync();
    const timer = window.setTimeout(sync, 120);
    const observer = new ResizeObserver(sync);
    observer.observe(frame);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [isExpanded, playerRef]);

  const createThumbnail = async (time: number): Promise<string | null> => {
    const video = videoElementRef.current;
    if (!video) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const previousTime = video.currentTime;
    const isPaused = video.paused;
    video.currentTime = clampSeekTime(time, duration);
    await new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.currentTime = previousTime;
    if (!isPaused) {
      void video.play().catch(() => undefined);
    }
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === VIDEO_KEYBOARD_SHORTCUTS.playPause) {
      event.preventDefault();
      playPause();
      return;
    }
    if (event.key === VIDEO_KEYBOARD_SHORTCUTS.seekBackward) {
      event.preventDefault();
      seekTo(getSeekTimeWithStep(currentTime, 'backward'));
      return;
    }
    if (event.key === VIDEO_KEYBOARD_SHORTCUTS.seekForward) {
      event.preventDefault();
      seekTo(getSeekTimeWithStep(currentTime, 'forward'));
      return;
    }
    if (event.key === VIDEO_KEYBOARD_SHORTCUTS.volumeUp) {
      event.preventDefault();
      setVolume(Math.min(1, volume + 0.1));
      return;
    }
    if (event.key === VIDEO_KEYBOARD_SHORTCUTS.volumeDown) {
      event.preventDefault();
      setVolume(Math.max(0, volume - 0.1));
      return;
    }
    if (event.key === VIDEO_KEYBOARD_SHORTCUTS.mute) {
      event.preventDefault();
      toggleMute();
    }
  };

  if (!isReady || !cssLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video player...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isExpanded ? (
        <div
          className="fixed inset-0 z-40 bg-black/65"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsExpanded(false);
            }
          }}
        />
      ) : null}
      <section
        className={
          isExpanded
            ? 'fixed left-1/2 top-1/2 z-50 grid h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl lg:grid-cols-[2fr_1fr]'
            : 'grid gap-4 lg:grid-cols-[2fr_1fr]'
        }
      >
        <div
          className="rounded-xl border border-slate-200 bg-black p-3"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={
            isExpanded
              ? { height: '100%' }
              : {
                  resize: 'both',
                  overflow: 'auto',
                  minHeight: '380px',
                  minWidth: '520px',
                  height: '560px',
                  maxWidth: '100%',
                  maxHeight: '78vh',
                }
          }
        >
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label={isExpanded ? 'Exit expanded mode' : 'Open expanded mode'}
            >
              {isExpanded ? <X size={16} /> : <Expand size={16} />}
            </button>
          </div>
          <div className="grid h-[calc(100%-2.5rem)] grid-rows-[minmax(0,1fr)_auto] gap-3">
            <div
              data-vjs-player
              ref={videoAreaRef}
              className="min-h-0 w-full overflow-hidden rounded-lg"
            >
              <video
                ref={videoElementRef}
                className="video-js vjs-big-play-centered h-full w-full"
              />
            </div>
            <div className="space-y-3 text-white">
              <div className="h-1 w-full rounded-full bg-white/20">
                <div className="h-1 rounded-full bg-blue-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-center">
                <button
                  type="button"
                  onClick={playPause}
                  className="rounded-md bg-white/10 p-2 hover:bg-white/20"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={(event) => seekTo(Number(event.target.value))}
                  className="w-full"
                  aria-label="Seek"
                />
                <div className="text-xs font-medium">
                  {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="rounded-md bg-white/10 p-2 hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    aria-label="Volume"
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={playbackRate}
                  onChange={(event) => setPlaybackRate(Number(event.target.value))}
                  className="rounded-md border border-white/20 bg-black px-2 py-2 text-sm"
                  aria-label="Playback speed"
                >
                  {VIDEO_PLAYBACK_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}x speed
                    </option>
                  ))}
                </select>
                <select
                  value={qualityLabel}
                  onChange={(event) => setQuality(event.target.value)}
                  className="rounded-md border border-white/20 bg-black px-2 py-2 text-sm"
                  aria-label="Playback quality"
                >
                  {sources.map((source) => (
                    <option key={source.label} value={source.label}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActivePanel('transcript')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                activePanel === 'transcript'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Transcript
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('bookmarks')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                activePanel === 'bookmarks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Bookmarks
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('annotations')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                activePanel === 'annotations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Annotations
            </button>
          </div>
          {activePanel === 'transcript' ? (
            <InteractiveTranscript cues={transcript} currentTime={currentTime} onSeek={seekTo} />
          ) : null}
          {activePanel === 'bookmarks' ? (
            <BookmarkSystem
              videoId={videoId}
              currentTime={currentTime}
              onSeek={seekTo}
              onCreateThumbnail={createThumbnail}
            />
          ) : null}
          {activePanel === 'annotations' ? (
            <CollaborativeAnnotations
              videoId={videoId}
              userId={userId}
              userName={userName}
              currentTime={currentTime}
              onSeek={seekTo}
            />
          ) : null}
        </div>
      </section>
      <style jsx global>{`
        .video-js {
          width: 100% !important;
          height: 100% !important;
        }

        .video-js .vjs-tech,
        .video-js iframe,
        .video-js object,
        .video-js embed {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
      `}</style>
    </>
  );
}
