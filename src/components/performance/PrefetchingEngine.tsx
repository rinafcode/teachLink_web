'use client';

import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSlowConnection } from '../../utils/performanceUtils';
import { useStore } from '../../store/stateManager';

interface PrefetchingEngineProps {
  strategies?: ('hover' | 'proximity' | 'intent')[];
}

/**
 * Engine to predictively prefetch routes based on user behavior and network conditions.
 */
const PrefetchingEngine: React.FC<PrefetchingEngineProps> = ({ strategies = ['hover'] }) => {
  const router = useRouter();
  const prefetchingEnabled = useStore((state) => state.user.preferences.prefetching);

  const handleIntent = useCallback(
    (href: string) => {
      if (!prefetchingEnabled || isSlowConnection()) {
        return;
      }
      router.prefetch(href);
    },
    [router, prefetchingEnabled],
  );

  useEffect(() => {
    if (!prefetchingEnabled || isSlowConnection() || !strategies.includes('hover')) return;

    const prefetched = new Set<string>();
    let hoverTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && link.origin === window.location.origin) {
        const href = link.pathname;
        if (prefetched.has(href)) return;

        if (hoverTimeout) clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          handleIntent(href);
          prefetched.add(href);
        }, 50); // 50ms intent delay
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && link.origin === window.location.origin) {
        const href = link.pathname;
        if (!prefetched.has(href)) {
          handleIntent(href);
          prefetched.add(href);
        }
      }
    };

    const touchOptions: AddEventListenerOptions = { passive: true };
    document.addEventListener('mouseover', handleMouseOver as EventListener);
    document.addEventListener('touchstart', handleTouchStart as EventListener, touchOptions);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver as EventListener);
      document.removeEventListener('touchstart', handleTouchStart as EventListener);
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [strategies, handleIntent, prefetchingEnabled]);

  // Proximity strategy could be implemented with Intersection Observer on all links

  return null; // Background component
};

export default PrefetchingEngine;
