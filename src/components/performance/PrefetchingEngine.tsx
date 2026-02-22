'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSlowConnection } from '../../utils/performanceUtils';

interface PrefetchingEngineProps {
  strategies?: ('hover' | 'proximity' | 'intent')[];
}

/**
 * Engine to predictively prefetch routes based on user behavior and network conditions.
 */
const PrefetchingEngine: React.FC<PrefetchingEngineProps> = ({ strategies = ['hover'] }) => {
  const router = useRouter();

  const handleIntent = useCallback((href: string) => {
    if (isSlowConnection()) {
      console.log(`[Prefetching] Slow connection detected. Skipping prefetch for: ${href}`);
      return;
    }

    console.log(`[Prefetching] Predictive prefetch started for: ${href}`);
    router.prefetch(href);
  }, [router]);

  useEffect(() => {
    if (!strategies.includes('hover')) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.origin === window.location.origin) {
        const href = link.pathname;
        handleIntent(href);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => document.removeEventListener('mouseover', handleMouseOver);
  }, [strategies, handleIntent]);

  // Proximity strategy could be implemented with Intersection Observer on all links
  
  return null; // Background component
};

export default PrefetchingEngine;
