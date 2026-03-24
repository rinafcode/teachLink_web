import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getFocusableElements,
  trapFocus,
  announceToScreenReader,
  checkAccessibilityIssues,
  AccessibilityIssue,
} from '@/utils/accessibilityUtils';

/**
 * Hook for managing keyboard navigation
 */
export function useKeyboardNavigation(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip links (Ctrl/Cmd + K)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const skipLink = document.querySelector<HTMLElement>('[data-skip-link]');
        skipLink?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return containerRef;
}

/**
 * Hook for focus trap (modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = getFocusableElements(containerRef.current);
    focusableElements[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (containerRef.current) {
        trapFocus(containerRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing focus visibility
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isFocusVisible;
}

/**
 * Hook for screen reader announcements
 */
export function useScreenReaderAnnouncement() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announceToScreenReader(message, priority);
    },
    []
  );

  return announce;
}

/**
 * Hook for accessibility testing
 */
export function useAccessibilityCheck(autoCheck: boolean = false) {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const checkAccessibility = useCallback(() => {
    if (!containerRef.current) return;

    setIsChecking(true);
    const foundIssues = checkAccessibilityIssues(containerRef.current);
    setIssues(foundIssues);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    if (autoCheck && containerRef.current) {
      // Delay check to allow DOM to settle
      const timer = setTimeout(checkAccessibility, 500);
      return () => clearTimeout(timer);
    }
  }, [autoCheck, checkAccessibility]);

  return {
    containerRef,
    issues,
    isChecking,
    checkAccessibility,
  };
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLive() {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const LiveRegion = useCallback(
    () => (
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    ),
    []
  );

  return { announce, LiveRegion };
}

/**
 * Hook for skip navigation
 */
export function useSkipNavigation() {
  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return skipToContent;
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
