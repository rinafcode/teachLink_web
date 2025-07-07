import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play } from 'lucide-react';

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

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  currentTime,
  onSeek
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeEntryRef = useRef<HTMLDivElement>(null);

  // Find the current transcript entry
  const currentEntryIndex = transcript.findIndex(entry => entry.time > currentTime) - 1;
  const currentEntry = currentEntryIndex >= 0 ? transcript[currentEntryIndex] : null;

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
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {transcript.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Clock size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No transcript available</p>
            <p className="text-sm">Transcript will appear here when available</p>
          </div>
        ) : (
          transcript.map((entry, index) => {
            const isActive = isActiveEntry(entry, index);
            
            return (
              <motion.div
                key={`${entry.time}-${index}`}
                ref={isActive ? activeEntryRef : null}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                onClick={() => onSeek(entry.time)}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(entry.time);
                    }}
                    className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    <Play size={12} />
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
          })
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
}; 