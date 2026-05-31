'use client';

import React, { useState, useCallback } from 'react';
import { Quote as QuoteIcon, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { GestureHandler } from '../mobile/GestureHandler';

export interface QuoteProps {
  /** The quote text to display */
  text: string;
  /** The author of the quote */
  author?: string;
  /** Optional source or citation */
  source?: string;
  /** Callback when quote is copied to clipboard */
  onCopy?: (text: string) => void;
  /** Callback when swiped left (for carousel navigation) */
  onSwipeLeft?: () => void;
  /** Callback when swiped right (for carousel navigation) */
  onSwipeRight?: () => void;
  /** Callback when pinched in (zoom out) */
  onPinchIn?: () => void;
  /** Callback when pinched out (zoom in) */
  onPinchOut?: () => void;
  /** Additional class names */
  className?: string;
  /** Whether to show navigation arrows (for carousel usage) */
  showNavigation?: boolean;
  /** Whether to show copy button */
  showCopyButton?: boolean;
  /** Custom quote icon */
  icon?: React.ReactNode;
}

/**
 * Quote Component with Gesture Support
 *
 * A reusable quote component that displays quotes with author attribution and gesture support.
 * Supports swipe navigation, tap to copy, and pinch gestures for accessibility.
 *
 * @example
 * ```tsx
 * <Quote
 *   text="The only way to do great work is to love what you do."
 *   author="Steve Jobs"
 *   onCopy={() => console.log('Copied!')}
 *   onSwipeLeft={() => console.log('Next quote')}
 * />
 * ```
 */
export const Quote: React.FC<QuoteProps> = ({
  text,
  author,
  source,
  onCopy,
  onSwipeLeft,
  onSwipeRight,
  onPinchIn,
  onPinchOut,
  className = '',
  showNavigation = false,
  showCopyButton = true,
  icon,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    onCopy?.(text);

    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  }, [text, onCopy]);

  const handleTap = useCallback(() => {
    if (showCopyButton) {
      handleCopy();
    }
  }, [showCopyButton, handleCopy]);

  return (
    <GestureHandler
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      onPinchIn={onPinchIn}
      onPinchOut={onPinchOut}
      onTap={handleTap}
      swipeThreshold={50}
      className={`relative bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 shadow-sm border border-purple-100 dark:border-purple-800/30 transition-all active:scale-[0.98] hover:shadow-md ${className}`}
      role="article"
      aria-label={`Quote by ${author || 'Unknown author'}`}
    >
      {/* Navigation Left */}
      {showNavigation && onSwipeLeft && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSwipeLeft();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label="Previous quote"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Quote Content */}
      <div className="relative">
        {/* Quote Icon */}
        <div className="absolute -top-4 -left-2 text-purple-300 dark:text-purple-600">
          {icon || <QuoteIcon className="w-12 h-12 opacity-50" />}
        </div>

        {/* Quote Text */}
        <blockquote className="relative pl-8 pr-12">
          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-100 font-medium leading-relaxed italic">
            {text}
          </p>
        </blockquote>

        {/* Author and Source */}
        {(author || source) && (
          <footer className="mt-4 pl-8 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            {author && (
              <cite className="not-italic text-gray-600 dark:text-gray-400 font-semibold">
                — {author}
              </cite>
            )}
            {source && (
              <>
                <span className="hidden sm:inline text-gray-400 dark:text-gray-500">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-500">{source}</span>
              </>
            )}
          </footer>
        )}
      </div>

      {/* Copy Button */}
      {showCopyButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-label={copied ? 'Copied to clipboard' : 'Copy quote to clipboard'}
          title={copied ? 'Copied!' : 'Copy quote'}
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      )}

      {/* Navigation Right */}
      {showNavigation && onSwipeRight && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSwipeRight();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-0 hover:opacity-100 focus:opacity-100"
          aria-label="Next quote"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Gesture Hint (visible on touch devices) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        Tap to copy • Swipe to navigate
      </div>
    </GestureHandler>
  );
};
