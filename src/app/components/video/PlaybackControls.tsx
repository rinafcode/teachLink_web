import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown } from 'lucide-react';

interface QualityOption {
  label: string;
  value: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

interface PlaybackControlsProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  quality?: string;
  onQualityChange?: (quality: string) => void;
  qualities?: QualityOption[];
  autoQuality?: boolean;
  onAutoQualityChange?: (auto: boolean) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackRate,
  onPlaybackRateChange,
  quality,
  onQualityChange,
  qualities = [
    { label: 'Auto', value: 'auto', width: 0, height: 0 },
    { label: '1080p', value: '1080p', width: 1920, height: 1080, bitrate: 5000 },
    { label: '720p', value: '720p', width: 1280, height: 720, bitrate: 2500 },
    { label: '480p', value: '480p', width: 854, height: 480, bitrate: 1000 },
    { label: '360p', value: '360p', width: 640, height: 360, bitrate: 500 }
  ],
  autoQuality = true,
  onAutoQualityChange
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

  return (
    <div className="flex items-center space-x-4 mt-2">
      {/* Speed Control */}
      <div className="relative">
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          className="flex items-center space-x-1 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
        >
          <span>{playbackRate}x</span>
          <ChevronDown size={12} />
        </button>

        <AnimatePresence>
          {showSpeedMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10"
            >
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    onPlaybackRateChange(speed);
                    setShowSpeedMenu(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                    playbackRate === speed ? 'bg-blue-600 text-white' : 'text-gray-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quality Control */}
      {onQualityChange && (
        <div className="relative">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
            >
              <Settings size={12} />
              <span>{quality ? qualities.find(q => q.value === quality)?.label || quality : 'Auto'}</span>
              <ChevronDown size={12} />
            </button>
            
            {onAutoQualityChange && (
              <button
                onClick={() => onAutoQualityChange(!autoQuality)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  autoQuality 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Auto Quality"
              >
                AUTO
              </button>
            )}
          </div>

          <AnimatePresence>
            {showQualityMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10"
              >
                {qualities.map((q) => (
                  <button
                    key={q.value}
                    onClick={() => {
                      onQualityChange(q.value);
                      setShowQualityMenu(false);
                    }}
                    className={`block w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors ${
                      quality === q.value ? 'bg-blue-600 text-white' : 'text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{q.label}</span>
                      {q.width && q.height && (
                        <span className="text-xs opacity-75">
                          {q.width}×{q.height}
                          {q.bitrate && ` (${Math.round(q.bitrate / 1000)}Mbps)`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}; 