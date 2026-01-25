import { useState, useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';

interface VideoError {
  message: string;
  code: number;
  type: 'network' | 'decode' | 'source' | 'unknown';
  retryCount: number;
}

export const useVideoPlayer = (videoRef: RefObject<HTMLVideoElement>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<VideoError | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err: any) => {
        setError({
          message: err.message || 'Failed to play video',
          code: err.code || 0,
          type: categorizeError(err),
          retryCount: 0
        });
      });
    }
  }, [videoRef]);

  const categorizeError = (err: any): VideoError['type'] => {
    if (err.name === 'NotAllowedError') return 'source';
    if (err.name === 'NotSupportedError') return 'decode';
    if (err.name === 'NetworkError') return 'network';
    return 'unknown';
  };

  const retry = useCallback(() => {
    if (retryCount < maxRetries && videoRef.current?.src) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setIsLoading(true);
      
      // Reload the video source
      const currentSrc = videoRef.current.src;
      videoRef.current.src = '';
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.src = currentSrc;
        }
      }, 100);
    }
  }, [retryCount, videoRef, maxRetries]);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [videoRef]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, [videoRef]);

  const setVolume = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolumeState(newVolume);
    }
  }, [videoRef]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRateState(rate);
    }
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, [videoRef]);

  const resetError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handleError = (e: any) => {
      const video = e.target;
      let errorMessage = 'Failed to load video';
      let errorType: VideoError['type'] = 'unknown';
      
      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - please check your connection';
            errorType = 'network';
            break;
          case video.error.MEDIA_ERR_DECODE:
            errorMessage = 'Video decode error - file may be corrupted';
            errorType = 'decode';
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            errorType = 'source';
            break;
          default:
            errorMessage = 'Unknown video error occurred';
        }
      }
      
      setError({
        message: errorMessage,
        code: video.error?.code || 0,
        type: errorType,
        retryCount
      });
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };

    const handleRateChange = () => {
      setPlaybackRateState(video.playbackRate);
    };

    // Add event listeners
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ratechange', handleRateChange);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ratechange', handleRateChange);
    };
  }, [videoRef]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    buffered,
    isLoading,
    error,
    isMuted,
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
  };
}; 