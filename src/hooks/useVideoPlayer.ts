import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import type { VideoSource } from '@/components/video/types';
import { clampSeekTime } from '@/utils/videoPlayerUtils';

type UseVideoPlayerOptions = {
  sources: VideoSource[];
  poster?: string;
};

export const useVideoPlayer = ({ sources, poster }: UseVideoPlayerOptions) => {
  const safePlay = useCallback((player: Player) => {
    void player.play().catch(() => undefined);
  }, []);

  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [qualityLabel, setQualityLabel] = useState(sources[0]?.label ?? '');

  const normalizedSources = useMemo(
    () =>
      sources.map((source) => ({
        src: source.src,
        type: source.type ?? 'video/mp4',
      })),
    [sources],
  );
  const hasYoutubeSource = useMemo(
    () =>
      sources.some(
        (source) =>
          source.type === 'video/youtube' ||
          source.src.includes('youtube.com/watch') ||
          source.src.includes('youtu.be/'),
      ),
    [sources],
  );

  useEffect(() => {
    let activePlayer: Player | null = null;
    let disposed = false;

    const init = async () => {
      const videoElement = videoElementRef.current;
      if (!videoElement || normalizedSources.length === 0) {
        return;
      }
      if (hasYoutubeSource) {
        await import('videojs-youtube');
      }
      if (disposed) {
        return;
      }
      const player = videojs(videoElement, {
        controls: false,
        autoplay: false,
        preload: 'auto',
        responsive: true,
        fluid: false,
        poster,
        techOrder: hasYoutubeSource ? ['youtube', 'html5'] : ['html5'],
        sources: normalizedSources,
      });
      activePlayer = player;
      playerRef.current = player;
      player.on('timeupdate', () => setCurrentTime(player.currentTime()));
      player.on('durationchange', () => setDuration(player.duration() || 0));
      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));
      player.on('volumechange', () => {
        setVolumeState(player.volume());
        setIsMuted(player.muted());
      });
      player.on('ratechange', () => setPlaybackRateState(player.playbackRate()));
    };

    void init();

    return () => {
      disposed = true;
      if (activePlayer) {
        activePlayer.dispose();
      }
      if (playerRef.current === activePlayer) {
        playerRef.current = null;
      }
    };
  }, [hasYoutubeSource, normalizedSources, poster]);

  const playPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    if (player.paused()) {
      safePlay(player);
      return;
    }
    player.pause();
  }, [safePlay]);

  const seekTo = useCallback((time: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const nextTime = clampSeekTime(time, player.duration() || 0);
    player.currentTime(nextTime);
  }, []);

  const setVolume = useCallback((next: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    const value = Math.max(0, Math.min(1, next));
    player.volume(value);
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    player.muted(!player.muted());
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    player.playbackRate(rate);
  }, []);

  const setQuality = useCallback(
    (label: string) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      const source = sources.find((item) => item.label === label);
      if (!source) {
        return;
      }
      const current = player.currentTime();
      const shouldPlay = !player.paused();
      player.src({ src: source.src, type: source.type ?? 'video/mp4' });
      player.one('loadedmetadata', () => {
        player.currentTime(current);
        if (shouldPlay) {
          safePlay(player);
        }
      });
      setQualityLabel(label);
    },
    [safePlay, sources],
  );

  return {
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
  };
};
