import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, X } from "lucide-react";

interface TouchOptimizedControlsProps {
  videoTitle: string;
  videoUrl: string;
  onClose: () => void;
}

export default function TouchOptimizedControls({
  videoTitle,
  videoUrl,
  onClose
}: TouchOptimizedControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [buffered, setBuffered] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTap = () => {
    setShowControls(true);
    resetControlsTimer();
  };

  const resetControlsTimer = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          await videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error('Error playing video:', err);
      }
    }
    resetControlsTimer();
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    resetControlsTimer();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.max(0, Math.min(percentage * duration, duration));
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimer();
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = Math.max(0, Math.min(percentage * duration, duration));
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
    resetControlsTimer();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(videoRef.current.volume || 1);
      }
    }
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    const element = videoRef.current;
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
    resetControlsTimer();
  };

  const changePlaybackRate = () => {
    if (!videoRef.current) return;
    
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
    resetControlsTimer();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      console.error('Video error:', video.error);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    if (video.src !== videoUrl) {
      video.src = videoUrl;
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);

      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [videoUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="relative w-full h-screen bg-black"
      onTouchStart={handleTap}
      onClick={handleTap}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="auto"
      />

      {/* Controls Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-linear-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white font-semibold text-lg truncate max-w-[70%]">
            {videoTitle}
          </h2>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform touch-manipulation"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div
            className="w-full h-10 flex items-center mb-3 touch-manipulation"
            onClick={handleProgressClick}
            onTouchMove={handleProgressTouch}
            onTouchStart={handleProgressTouch}
          >
            <div className="w-full h-1.5 bg-white/30 rounded-full relative">
              {/* Buffered progress */}
              <div
                className="absolute top-0 left-0 h-full bg-white/50 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Current progress */}
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full z-10"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg z-20 touch-manipulation"
                style={{ left: `calc(${progress}% - 12px)` }}
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-white text-sm mb-4">
            <span>{formatTime(currentTime)}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={changePlaybackRate}
                className="px-3 py-1 bg-white/20 rounded text-xs font-medium"
              >
                {playbackRate}x
              </button>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => skip(-10)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 touch-manipulation"
                aria-label="Skip back 10 seconds"
              >
                <SkipBack className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center active:bg-white/30 touch-manipulation"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 touch-manipulation"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center touch-manipulation"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-white touch-manipulation"
                  aria-label="Volume control"
                />
              </div>

              <button
                onClick={toggleFullscreen}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 touch-manipulation"
                aria-label="Toggle fullscreen"
              >
                <Maximize className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!isPlaying && currentTime === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}