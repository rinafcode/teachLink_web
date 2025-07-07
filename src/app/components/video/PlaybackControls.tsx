import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown } from 'lucide-react';

interface PlaybackControlsProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  quality?: string;
  onQualityChange?: (quality: string) => void;
  qualities?: string[];
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playbackRate,
  onPlaybackRateChange,
  quality,
  onQualityChange,
  qualities = ['1080p', '720p', '480p', '360p']
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
          <button
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className="flex items-center space-x-1 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-white text-sm"
          >
            <Settings size={12} />
            <span>{quality || 'Auto'}</span>
            <ChevronDown size={12} />
          </button>

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
                    key={q}
                    onClick={() => {
                      onQualityChange(q);
                      setShowQualityMenu(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-700 transition-colors ${
                      quality === q ? 'bg-blue-600 text-white' : 'text-gray-200'
                    }`}
                  >
                    {q}
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