import { useState, useEffect, useRef, useCallback } from 'react';

export const useVideoPlayer = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        setError(err.message);
      });
    }
  }, [videoRef]);

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

    const handleError = () => {
      setError('Failed to load video');
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
    play,
    pause,
    seekTo,
    setVolume,
    setPlaybackRate,
    toggleMute,
  };
}; 