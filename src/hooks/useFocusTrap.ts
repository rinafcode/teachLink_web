import { useEffect, useRef, type RefObject } from 'react';
import { getFocusableElements } from '@/utils/accessibilityUtils';

export interface UseFocusTrapOptions {
  /** Element to focus when the trap becomes active. Falls back to the first control. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Whether to return focus to the element that opened the dialog. Defaults to true. */
  restoreFocus?: boolean;
}

/**
 * Keeps keyboard focus inside an active dialog and returns it to its opener on close.
 *
 * The hook deliberately discovers focusable elements for each keyboard event so controls
 * added, disabled, or removed while a dialog is open are handled correctly.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  { initialFocusRef, restoreFocus = true }: UseFocusTrapOptions = {},
) {
  const containerRef = useRef<T>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitialElement = () => {
      const requestedElement = initialFocusRef?.current;
      const fallbackElement = getFocusableElements(container)[0];
      const target =
        requestedElement && container.contains(requestedElement)
          ? requestedElement
          : fallbackElement;

      if (target) {
        target.focus();
        return;
      }

      if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
      container.focus();
    };

    focusInitialElement();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !container.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === last || !container.contains(activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) focusInitialElement();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      if (restoreFocus && previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [initialFocusRef, isActive, restoreFocus]);

  return containerRef;
}
