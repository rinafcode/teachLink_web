import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Inline SVG Icons to replace lucide-react
const ClockIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlayIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

interface TranscriptEntry {
  time: number;
  text: string;
  speaker?: string;
}

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = React.memo(({
  transcript,
  currentTime,
  onSeek
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeEntryRef = useRef<HTMLDivElement>(null);

  // Find the current transcript entry
  const currentEntryIndex = transcript.findIndex(entry => entry.time > currentTime) - 1;
  const currentEntry = currentEntryIndex >= 0 ? transcript[currentEntryIndex] : null;

  // Virtual scrolling for performance with long transcripts
  const VISIBLE_ITEMS = 20;
  const ITEM_HEIGHT = 80;
  
  const startIndex = Math.max(0, currentEntryIndex - Math.floor(VISIBLE_ITEMS / 2));
  const endIndex = Math.min(transcript.length, startIndex + VISIBLE_ITEMS);
  const visibleEntries = transcript.slice(startIndex, endIndex);
  
  const containerHeight = transcript.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  // Auto-scroll to current entry
  useEffect(() => {
    if (activeEntryRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeEntryRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();
      
      const isVisible = 
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom;
      
      if (!isVisible) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isActiveEntry = (entry: TranscriptEntry, index: number) => {
    if (index === currentEntryIndex) return true;
    
    // Check if current time is within this entry's range
    const nextEntry = transcript[index + 1];
    const endTime = nextEntry ? nextEntry.time : Infinity;
    return currentTime >= entry.time && currentTime < endTime;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
        {currentEntry && (
          <p className="text-sm text-gray-600 mt-1">
            Current: {formatTime(currentTime)}
          </p>
        )}
      </div>

      {/* Transcript Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ height: 'calc(100% - 120px)' }}
      >
        {transcript.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <ClockIcon size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No transcript available</p>
            <p className="text-sm">Transcript will appear here when available</p>
          </div>
        ) : (
          <div style={{ height: containerHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleEntries.map((entry, visibleIndex) => {
                const actualIndex = startIndex + visibleIndex;
                const isActive = isActiveEntry(entry, actualIndex);
                
                return (
                  <motion.div
                    key={`${entry.time}-${actualIndex}`}
                    ref={isActive ? activeEntryRef : null}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: visibleIndex * 0.02 }}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-2 ${
                      isActive 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => onSeek(entry.time)}
                    style={{ height: ITEM_HEIGHT - 8 }}
                  >
                    <div className="flex items-start space-x-3 h-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeek(entry.time);
                        }}
                        className={`flex-shrink-0 p-1 rounded-full transition-colors self-start mt-1 ${
                          isActive 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <PlayIcon size={12} />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            {formatTime(entry.time)}
                          </span>
                          {entry.speaker && (
                            <span className="text-xs text-blue-600 font-medium">
                              {entry.speaker}
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm leading-relaxed ${
                          isActive ? 'text-gray-900 font-medium' : 'text-gray-700'
                        }`}>
                          {entry.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer with search/filter options */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{transcript.length} entries</span>
          <span>Click any entry to jump to that time</span>
        </div>
      </div>
    </div>
  );
}); 