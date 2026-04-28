'use client';

import { usePathname } from 'next/navigation';
import { useFocusOnRouteChange } from '@/hooks/useAccessibility';

/**
 * Manages focus on route changes by moving focus to the main content landmark.
 * Render once inside RootProviders (client boundary).
 */
export function RouteChangeAnnouncer() {
  const pathname = usePathname();
  useFocusOnRouteChange(pathname);
  return null;
}
