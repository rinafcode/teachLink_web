'use client';

import { RefObject, useEffect, useState, useCallback } from 'react';

interface UseVideoLazyLoadProps {
  enabled?: boolean;
  threshold?: number | number[];
  rootMargin?: string;
}

/**
 * Hook for implementing lazy loading of video elements using Intersection Observer
 * Prevents loading entire video until it's visible in the viewport
 */
export const useVideoLazyLoad = (
  videoRef: RefObject<HTMLVideoElement>,
  options: UseVideoLazyLoadProps = {},
) => {
  const {
    enabled = true,
    threshold = 0.1,
    rootMargin = '50px',
  } = options;

  const [isInViewport, setIsInViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    // If already intersecting initially, mark as loaded
    const video = videoRef.current;
    if (!isLoaded && isInViewport) {
      // Start loading by setting event listeners
      setIsLoaded(true);
    }

  }, [enabled, isInViewport, isLoaded]);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            // Mark as loaded when visible
            if (!isLoaded) {
              setIsLoaded(true);
            }
          } else {
            setIsInViewport(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    const videoElement = videoRef.current;
    if (videoElement) {
      observer.observe(videoElement);
    }

    return () => {
      if (videoElement) {
        observer.unobserve(videoElement);
      }
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, isLoaded]);

  const resetLazyLoad = useCallback(() => {
    setIsLoaded(false);
    setIsInViewport(false);
  }, []);

  return {
    isInViewport,
    isLoaded,
    resetLazyLoad,
    shouldLoadVideo: isLoaded && !enabled === false ? true : enabled ? isLoaded : true,
  };
};
