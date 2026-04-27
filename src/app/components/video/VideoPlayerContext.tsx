'use client';

import { createContext, useContext } from 'react';

export interface VideoQualityControlOption {
  label: string;
  value: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

export interface VideoPlayerContextValue {
  lessonId: string;
  userId?: string;
  transcript: Array<{ time: number; text: string; speaker?: string }>;
  currentTime: number;
  duration: number;
  playbackRate: number;
  autoQuality: boolean;
  selectedQualityValue: string;
  qualitiesForControls?: VideoQualityControlOption[];
  seekToLearning: (time: number) => void;
  setPlaybackRateLearning: (rate: number) => void;
  setQualityLearning: (value: string) => void;
  setAutoQualityLearning: (auto: boolean) => void;
  onBookmark: (bookmark: { time: number; title: string; note?: string }) => void;
  onNote: (note: { time: number; text: string }) => void;
}

export const VideoPlayerContext = createContext<VideoPlayerContextValue | null>(null);

export const useVideoPlayerContext = (): VideoPlayerContextValue => {
  const ctx = useContext(VideoPlayerContext);
  if (!ctx) throw new Error('useVideoPlayerContext must be used within AdvancedVideoPlayer');
  return ctx;
};
