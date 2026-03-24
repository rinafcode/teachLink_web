'use client';

import React, { useEffect, useState } from 'react';
import { useAriaLive, useScreenReaderAnnouncement } from '@/hooks/useAccessibility';
import { Volume2, VolumeX } from 'lucide-react';

interface ScreenReaderOptimizerProps {
  children: React.ReactNode;
  enableAnnouncements?: boolean;
}

export function ScreenReaderOptimizer({
  children,
  enableAnnouncements = true,
}: ScreenReaderOptimizerProps) {
  const { LiveRegion } = useAriaLive();
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);

  useEffect(() => {
    // Detect if screen reader is likely active
    const detectScreenReader = () => {
      // Check for common screen reader indicators
      const hasAriaLive = document.querySelectorAll('[aria-live]').length > 0;
      const hasScreenReaderClass = document.body.classList.contains('screen-reader-active');

      setIsScreenReaderActive(hasAriaLive || hasScreenReaderClass);
    };

    detectScreenReader();

    // Monitor DOM changes
    const observer = new MutationObserver(detectScreenReader);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Screen Reader Only Content */}
      <div className="sr-only" role="region" aria-label="Screen reader information">
        <h1>Accessible Learning Platform</h1>
        <p>
          This platform is optimized for screen readers. Use heading navigation to jump between
          sections, and form labels are provided for all inputs.
        </p>
      </div>

      {/* Live Region for Announcements */}
      {enableAnnouncements && <LiveRegion />}

      {/* Main Content with Enhanced ARIA */}
      <div
        role="application"
        aria-label="Main application content"
        data-screen-reader-optimized="true"
      >
        {children}
      </div>

      {/* Screen Reader Status Indicator (Visual Only) */}
      <div
        className="fixed top-4 right-4 z-50 px-3 py-2 bg-gray-800 text-white text-xs rounded-full flex items-center gap-2"
        aria-hidden="true"
      >
        {isScreenReaderActive ? (
          <>
            <Volume2 size={14} />
            <span>SR Active</span>
          </>
        ) : (
          <>
            <VolumeX size={14} />
            <span>SR Inactive</span>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Component for creating accessible descriptions
 */
interface AccessibleDescriptionProps {
  id: string;
  children: React.ReactNode;
}

export function AccessibleDescription({ id, children }: AccessibleDescriptionProps) {
  return (
    <div id={id} className="sr-only">
      {children}
    </div>
  );
}

/**
 * Component for accessible loading states
 */
interface AccessibleLoadingProps {
  message?: string;
  isLoading: boolean;
}

export function AccessibleLoading({
  message = 'Loading content',
  isLoading,
}: AccessibleLoadingProps) {
  const announce = useScreenReaderAnnouncement();

  useEffect(() => {
    if (isLoading) {
      announce(message, 'polite');
    } else {
      announce('Content loaded', 'polite');
    }
  }, [isLoading, message, announce]);

  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center justify-center p-4"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Component for accessible error messages
 */
interface AccessibleErrorProps {
  id?: string;
  message: string;
  onDismiss?: () => void;
}

export function AccessibleError({ id, message, onDismiss }: AccessibleErrorProps) {
  const announce = useScreenReaderAnnouncement();

  useEffect(() => {
    announce(`Error: ${message}`, 'assertive');
  }, [message, announce]);

  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error message"
            className="ml-4 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Component for accessible success messages
 */
interface AccessibleSuccessProps {
  message: string;
  onDismiss?: () => void;
}

export function AccessibleSuccess({ message, onDismiss }: AccessibleSuccessProps) {
  const announce = useScreenReaderAnnouncement();

  useEffect(() => {
    announce(message, 'polite');
  }, [message, announce]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="p-4 bg-green-50 border border-green-200 rounded-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800">Success</h3>
          <p className="mt-1 text-sm text-green-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss success message"
            className="ml-4 text-green-500 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Component for accessible progress indicators
 */
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showPercentage?: boolean;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  showPercentage = true,
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label id="progress-label" className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {showPercentage && (
          <span className="text-sm text-gray-600" aria-hidden="true">
            {percentage}%
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby="progress-label"
        aria-valuetext={`${percentage} percent complete`}
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="sr-only">{`${label}: ${percentage}% complete`}</span>
    </div>
  );
}
