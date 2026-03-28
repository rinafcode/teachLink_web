'use client';

import { createContext } from 'react';
import type { AccessibilityIssue } from '@/utils/accessibilityUtils';

export type AnnouncePriority = 'polite' | 'assertive';

export interface AccessibilityContextValue {
  announce: (message: string, priority?: AnnouncePriority) => void;
  prefersReducedMotion: boolean;
  /** Keyboard modality for focus visibility (Tab vs pointer); use for :focus-visible styling */
  isKeyboardUser: boolean;
  /** Run heuristic WCAG-oriented checks on the document body */
  runPageAudit: () => AccessibilityIssue[];
  /** Extra announcements for dynamic regions (off by default) */
  verboseLiveRegions: boolean;
}

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);
