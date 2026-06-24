'use client';

import { useCallback, useRef } from 'react';

export interface DropdownHeatmapEvent {
  dropdownId: string;
  itemLabel: string;
  itemIndex: number;
  timestamp: number;
  sessionId: string;
}

const SESSION_ID =
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}`;

const STORAGE_KEY = 'dropdown:heatmap';
const MAX_EVENTS = 500;

function readEvents(): DropdownHeatmapEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DropdownHeatmapEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(events: DropdownHeatmapEvent[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Hook that tracks dropdown menu interactions for heatmap analytics.
 * Records which dropdown items are clicked, with timestamps and session context.
 * Data is stored in localStorage and dispatched as a custom DOM event for
 * consumption by analytics integrations.
 */
export function useDropdownHeatmap(dropdownId: string) {
  const hoverStart = useRef<Record<number, number>>({});

  const trackClick = useCallback(
    (itemLabel: string, itemIndex: number) => {
      const event: DropdownHeatmapEvent = {
        dropdownId,
        itemLabel,
        itemIndex,
        timestamp: Date.now(),
        sessionId: SESSION_ID,
      };

      const events = readEvents();
      events.push(event);
      writeEvents(events);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dropdown:heatmap:click', { detail: event }),
        );
      }
    },
    [dropdownId],
  );

  const trackHoverStart = useCallback((itemIndex: number) => {
    hoverStart.current[itemIndex] = Date.now();
  }, []);

  const trackHoverEnd = useCallback(
    (itemLabel: string, itemIndex: number) => {
      const start = hoverStart.current[itemIndex];
      if (start == null) return;
      const dwellMs = Date.now() - start;
      delete hoverStart.current[itemIndex];

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dropdown:heatmap:hover', {
            detail: { dropdownId, itemLabel, itemIndex, dwellMs, sessionId: SESSION_ID },
          }),
        );
      }
    },
    [dropdownId],
  );

  return { trackClick, trackHoverStart, trackHoverEnd };
}

/** Returns all recorded heatmap events from localStorage. */
export function getDropdownHeatmapEvents(): DropdownHeatmapEvent[] {
  return readEvents();
}

/** Clears all stored heatmap events. */
export function clearDropdownHeatmapEvents(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
