'use client';

import { useEffect, useId, useState, type RefObject } from 'react';
import { useFocusTrap } from '@/hooks/useAccessibility';
import { getRovingFocusCandidates } from '@/utils/accessibilityUtils';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

function focusMainContent(): void {
  const main =
    document.getElementById('main-content') ||
    document.querySelector<HTMLElement>('main[role="main"]') ||
    document.querySelector<HTMLElement>('main');
  if (main) {
    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    main.focus({ preventScroll: false });
    main.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }
}

export interface KeyboardShortcutHelpItem {
  keys: string;
  description: string;
}

const DEFAULT_HELP: KeyboardShortcutHelpItem[] = [
  { keys: 'Tab / Shift+Tab', description: 'Move focus to next or previous control' },
  { keys: 'Enter / Space', description: 'Activate button or follow link' },
  { keys: 'Escape', description: 'Close dialogs when focus is inside them' },
  { keys: 'Alt+M', description: 'Move focus to main content' },
  { keys: 'Shift+?', description: 'Open or close this keyboard shortcuts panel' },
];

interface KeyboardNavigationProps {
  /** Extra rows for the shortcuts help dialog */
  extraShortcuts?: KeyboardShortcutHelpItem[];
  /** Called after Alt+M successfully focuses main */
  onSkipToMain?: () => void;
}

/**
 * Global keyboard affordances: skip to main, shortcuts help dialog with focus trap.
 */
export function KeyboardNavigation({ extraShortcuts = [], onSkipToMain }: KeyboardNavigationProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if ((e.altKey && e.key.toLowerCase() === 'm') || (e.altKey && e.code === 'KeyM')) {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        focusMainContent();
        onSkipToMain?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onSkipToMain]);

  useEffect(() => {
    if (!open) return;
    const onDocKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onDocKey);
    return () => document.removeEventListener('keydown', onDocKey);
  }, [open]);

  const rows = [...DEFAULT_HELP, ...extraShortcuts];

  return (
    <>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-[10000] bg-black/40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            ref={trapRef as RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed left-1/2 top-1/2 z-[10001] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900"
          >
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Keyboard shortcuts
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              These shortcuts work when focus is not inside a text field.
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 font-medium text-gray-700 dark:text-gray-300">Shortcut</th>
                  <th className="pb-2 font-medium text-gray-700 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.keys + row.description}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 pr-3 font-mono text-xs text-gray-800 dark:text-gray-200">
                      {row.keys}
                    </td>
                    <td className="py-2 text-gray-600 dark:text-gray-400">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </>
      ) : null}
      {/* Roving tabindex helper: expose landmark navigation hook for custom toolbars via data-roving-root */}
      <RovingTabIndexCoordinator />
    </>
  );
}

/**
 * Within [data-roving-root], Arrow Left/Right move focus between focusable controls (WCAG-friendly toolbars).
 */
function RovingTabIndexCoordinator() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      const root = target.closest('[data-roving-root]');
      if (!root) return;

      const items = getRovingFocusCandidates(root as HTMLElement);
      if (items.length === 0) return;

      const idx = items.indexOf(target);
      if (idx === -1) return;

      e.preventDefault();
      const next =
        e.key === 'ArrowRight'
          ? items[(idx + 1) % items.length]
          : items[(idx - 1 + items.length) % items.length];
      next?.focus();
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return null;
}
