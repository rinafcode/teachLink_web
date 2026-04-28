'use client';

import { useThemeContext } from '@/contexts/ThemeContext';

/**
 * Shared theme hook with persisted preference support.
 */
export function useTheme() {
  return useThemeContext();
}
