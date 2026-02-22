'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyLoadingManagerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number; // 0 to 1
  rootMargin?: string;
  componentName?: string;
}

/**
 * Intelligent wrapper for lazy loading components when they enter the viewport.
 */
const LazyLoadingManager: React.FC<LazyLoadingManagerProps> = ({
  children,
  fallback = <div className="animate-pulse bg-gray-200 h-32 w-full rounded-md" />,
  threshold = 0.1,
  rootMargin = '200px',
  componentName = 'Component'
}) => {
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView && !hasBeenInView) {
      setHasBeenInView(true);
      console.log(`[LazyLoading] Triggering load for ${componentName}`);
    }
  }, [inView, hasBeenInView, componentName]);

  return (
    <div ref={ref} className="w-full">
      {hasBeenInView ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

export default LazyLoadingManager;
