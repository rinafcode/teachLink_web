'use client';

import { createContext } from 'react';
import type { AccessibilityIssue } from '@/utils/accessibilityUtils';

export type AnnouncePriority = 'polite' | 'assertive';

export interface AccessibilityContextValue {
  announce: (message: string, priority?: AnnouncePriority) => void;
  prefersReducedMotion: boolean;
  /** True when user has navigated with keyboard (Tab) recently */
  isKeyboardUser: boolean;
  /** Run heuristic WCAG-oriented checks on the document body */
  runPageAudit: () => AccessibilityIssue[];
  /** Extra announcements for dynamic regions (off by default) */
  verboseLiveRegions: boolean;
}

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);
