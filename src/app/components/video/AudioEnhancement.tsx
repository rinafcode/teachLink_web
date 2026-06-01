'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, ChevronDown } from 'lucide-react';
import { useVideoPlayerContext } from './VideoPlayerContext';

export const AudioEnhancement: React.FC = () => {
  const {
    audioEnhancement: {
      enabled,
      bassBoost,
      voiceClarity,
      noiseReduction,
      toggle,
      setBassBoost,
      setVoiceClarity,
      setNoiseReduction,
      isSupported,
    },
  } = useVideoPlayerContext();

  const [showPanel, setShowPanel] = useState(false);

  if (!isSupported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPanel((s) => !s)}
        aria-label="Audio enhancement settings"
        aria-expanded={showPanel}
        className={`flex items-center space-x-1 px-3 py-1 rounded transition-colors text-sm ${
          enabled ? 'bg-blue-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
        }`}
      >
        <Wand2 size={12} />
        <span>Enhance</span>
        <ChevronDown size={12} />
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800 rounded-lg shadow-lg p-3 z-10 space-y-3"
          >
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">Audio Enhancement</span>
              <button
                type="button"
                onClick={toggle}
                aria-label={enabled ? 'Disable audio enhancement' : 'Enable audio enhancement'}
                aria-pressed={enabled}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  enabled ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Sliders — only interactive when enabled */}
            <div className={`space-y-2 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <Slider
                label="Bass Boost"
                value={bassBoost}
                min={0}
                max={20}
                step={1}
                unit="dB"
                onChange={setBassBoost}
              />
              <Slider
                label="Voice Clarity"
                value={voiceClarity}
                min={0}
                max={20}
                step={1}
                unit="dB"
                onChange={setVoiceClarity}
              />
              <Slider
                label="Noise Reduction"
                value={Math.round(noiseReduction * 100)}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => setNoiseReduction(v / 100)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, unit, onChange }) => (
  <div>
    <div className="flex justify-between text-xs text-gray-300 mb-1">
      <span>{label}</span>
      <span>
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={label}
      className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer accent-blue-500"
    />
  </div>
);
