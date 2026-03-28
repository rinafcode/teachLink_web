'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityContext, type AnnouncePriority } from './AccessibilityContext';
import { AccessibilityAudit } from './AccessibilityAudit';
import { ScreenReaderSupport } from './ScreenReaderSupport';
import { KeyboardNavigation, type KeyboardShortcutHelpItem } from './KeyboardNavigation';
import { announceToScreenReader, checkAccessibilityIssues } from '@/utils/accessibilityUtils';
import { useFocusVisible } from '@/hooks/useAccessibility';

export type { KeyboardShortcutHelpItem };

interface AccessibilityProviderProps {
  children: React.ReactNode;
  /** Sets summary text for screen readers; optional main landmark label when unset */
  pageLabel?: string;
  /** Extra announcements for dynamic regions */
  verboseLiveRegions?: boolean;
  /** Extra shortcuts listed in the Shift+? dialog */
  keyboardShortcuts?: KeyboardShortcutHelpItem[];
  /** Render dev audit panel (defaults to true in development) */
  enableDevAudit?: boolean;
}

function subscribeReducedMotion(callback: (matches: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  callback(mq.matches);
  const listener = (e: MediaQueryListEvent) => callback(e.matches);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

/**
 * Global accessibility context: announcements, motion preference, keyboard focus modality, audit entry points.
 */
export function AccessibilityProvider({
  children,
  pageLabel = 'TeachLink application',
  verboseLiveRegions = false,
  keyboardShortcuts,
  enableDevAudit = process.env.NODE_ENV === 'development',
}: AccessibilityProviderProps) {
  const politeLiveRef = useRef<HTMLDivElement | null>(null);
  const assertiveLiveRef = useRef<HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isKeyboardUser = useFocusVisible();

  useEffect(() => subscribeReducedMotion(setPrefersReducedMotion), []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(
      'data-a11y-keyboard-user',
      isKeyboardUser ? 'true' : 'false',
    );
  }, [isKeyboardUser]);

  const announce = useCallback((message: string, priority: AnnouncePriority = 'polite') => {
    const el = priority === 'assertive' ? assertiveLiveRef.current : politeLiveRef.current;
    if (el) {
      el.textContent = '';
      window.requestAnimationFrame(() => {
        el.textContent = message;
        window.setTimeout(() => {
          el.textContent = '';
        }, 1200);
      });
    } else {
      announceToScreenReader(message, priority);
    }
  }, []);

  const runPageAudit = useCallback(() => {
    if (typeof document === 'undefined') return [];
    return checkAccessibilityIssues(document.body);
  }, []);

  const value = useMemo(
    () => ({
      announce,
      prefersReducedMotion,
      isKeyboardUser,
      runPageAudit,
      verboseLiveRegions,
    }),
    [announce, prefersReducedMotion, isKeyboardUser, runPageAudit, verboseLiveRegions],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      <ScreenReaderSupport
        politeRef={politeLiveRef}
        assertiveRef={assertiveLiveRef}
        pageLabel={pageLabel}
      />
      <KeyboardNavigation extraShortcuts={keyboardShortcuts} />
      {enableDevAudit ? <AccessibilityAudit /> : null}
      {children}
    </AccessibilityContext.Provider>
  );
}
