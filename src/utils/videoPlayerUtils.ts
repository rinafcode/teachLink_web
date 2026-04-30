import { VIDEO_SEEK_STEP_SECONDS } from '@/components/video/constants';
import type { TranscriptCue } from '@/components/video/types';

export const formatVideoTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getProgressPercent = (currentTime: number, duration: number): number => {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
};

export const getActiveCueId = (cues: TranscriptCue[], currentTime: number): string | null => {
  const match = cues.find((cue) => currentTime >= cue.start && currentTime < cue.end);
  return match?.id ?? null;
};

export const getVideoStorageKey = (videoId: string, key: string): string => {
  return `video-player:${encodeURIComponent(videoId)}:${key}`;
};

export const clampSeekTime = (time: number, duration: number): number => {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(duration, time));
};

export const getSeekTimeWithStep = (
  currentTime: number,
  direction: 'forward' | 'backward',
): number => {
  if (direction === 'forward') {
    return currentTime + VIDEO_SEEK_STEP_SECONDS;
  }
  return currentTime - VIDEO_SEEK_STEP_SECONDS;
};
