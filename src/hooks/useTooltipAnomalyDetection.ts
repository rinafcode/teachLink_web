/**
 * useTooltipAnomalyDetection
 *
 * Detects anomalous tooltip interaction patterns and reports them.
 *
 * Anomalies detected:
 *  - "rapid-toggle"  : tooltip opened >5 times within 3 seconds
 *  - "long-hover"    : tooltip held open for >10 seconds continuously
 *  - "multi-open"    : more than 3 distinct tooltips open simultaneously
 */

import { useCallback, useRef, useState } from 'react';

export interface AnomalyEvent {
  type: 'rapid-toggle' | 'long-hover' | 'multi-open';
  tooltipId: string;
  timestamp: number;
  detail?: string;
}

export interface UseTooltipAnomalyDetectionOptions {
  /** Max opens per window before "rapid-toggle" fires (default 5) */
  rapidToggleThreshold?: number;
  /** Window size in ms for rapid-toggle detection (default 3000) */
  rapidToggleWindowMs?: number;
  /** Max continuous open duration in ms before "long-hover" fires (default 10000) */
  longHoverThresholdMs?: number;
  /** Max simultaneous open tooltips before "multi-open" fires (default 3) */
  multiOpenThreshold?: number;
  /** Called whenever an anomaly is detected */
  onAnomaly?: (event: AnomalyEvent) => void;
}

export interface TooltipTracker {
  /** Call when a tooltip opens */
  onOpen: (tooltipId: string) => void;
  /** Call when a tooltip closes */
  onClose: (tooltipId: string) => void;
  /** Current list of detected anomalies */
  anomalies: AnomalyEvent[];
  /** Clear the anomaly log */
  clearAnomalies: () => void;
}

export function useTooltipAnomalyDetection(
  options: UseTooltipAnomalyDetectionOptions = {}
): TooltipTracker {
  const {
    rapidToggleThreshold = 5,
    rapidToggleWindowMs = 3000,
    longHoverThresholdMs = 10000,
    multiOpenThreshold = 3,
    onAnomaly,
  } = options;

  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);

  // Per-tooltip open counts within the current time window
  const openCountsRef = useRef<Map<string, { count: number; windowStart: number }>>(new Map());
  // Per-tooltip long-hover timers
  const longHoverTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Currently open tooltip IDs
  const openSetRef = useRef<Set<string>>(new Set());

  const report = useCallback(
    (event: AnomalyEvent) => {
      setAnomalies((prev) => [...prev, event]);
      onAnomaly?.(event);
    },
    [onAnomaly]
  );

  const onOpen = useCallback(
    (tooltipId: string) => {
      const now = Date.now();

      // --- rapid-toggle detection ---
      const entry = openCountsRef.current.get(tooltipId) ?? { count: 0, windowStart: now };
      if (now - entry.windowStart > rapidToggleWindowMs) {
        entry.count = 0;
        entry.windowStart = now;
      }
      entry.count += 1;
      openCountsRef.current.set(tooltipId, entry);

      if (entry.count > rapidToggleThreshold) {
        report({
          type: 'rapid-toggle',
          tooltipId,
          timestamp: now,
          detail: `Opened ${entry.count} times in ${rapidToggleWindowMs}ms`,
        });
        entry.count = 0;
        entry.windowStart = now;
      }

      // --- long-hover detection ---
      const existingTimer = longHoverTimersRef.current.get(tooltipId);
      if (existingTimer) clearTimeout(existingTimer);
      const timer = setTimeout(() => {
        report({
          type: 'long-hover',
          tooltipId,
          timestamp: Date.now(),
          detail: `Open for >${longHoverThresholdMs}ms`,
        });
        longHoverTimersRef.current.delete(tooltipId);
      }, longHoverThresholdMs);
      longHoverTimersRef.current.set(tooltipId, timer);

      // --- multi-open detection ---
      openSetRef.current.add(tooltipId);
      if (openSetRef.current.size > multiOpenThreshold) {
        report({
          type: 'multi-open',
          tooltipId,
          timestamp: now,
          detail: `${openSetRef.current.size} tooltips open simultaneously`,
        });
      }
    },
    [rapidToggleThreshold, rapidToggleWindowMs, longHoverThresholdMs, multiOpenThreshold, report]
  );

  const onClose = useCallback((tooltipId: string) => {
    // Cancel long-hover timer
    const timer = longHoverTimersRef.current.get(tooltipId);
    if (timer) {
      clearTimeout(timer);
      longHoverTimersRef.current.delete(tooltipId);
    }
    openSetRef.current.delete(tooltipId);
  }, []);

  const clearAnomalies = useCallback(() => setAnomalies([]), []);

  return { onOpen, onClose, anomalies, clearAnomalies };
}

export default useTooltipAnomalyDetection;
