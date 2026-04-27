import { useCallback, useEffect, useRef } from "react";
import analytics, { EventName, EventProperties } from "@/utils/analytics";

/**
 * useAnalytics – React hook for consistent event tracking.
 *
 * Automatically fires a `page_view` event on mount (opt-out via `trackPageView: false`).
 * Provides a `track` helper that merges any page-level context automatically.
 *
 * @example
 * ```tsx
 * function CoursePage({ course }) {
 *   const { track } = useAnalytics({ page: "course_detail", courseId: course.id });
 *
 *   function handleEnroll() {
 *     track("course_started", { courseId: course.id });
 *     enroll(course.id);
 *   }
 * }
 * ```
 */
export interface UseAnalyticsOptions {
  /** Additional properties attached to every event in this component */
  context?: EventProperties;
  /**
   * Whether to auto-track a page_view on mount.
   * Default: true when used at the page/route level; pass false for sub-components.
   */
  trackPageView?: boolean;
  /** Extra properties for the auto page_view event */
  pageViewProperties?: EventProperties;
}

export interface UseAnalyticsReturn {
  /** Track an event with optional extra properties */
  track: (name: EventName, properties?: EventProperties) => void;
  /** Manually fire a page_view (useful for SPA route changes) */
  trackPageView: (overrides?: EventProperties) => void;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { context = {}, trackPageView: autoTrack = false, pageViewProperties = {} } = options;

  // Keep a stable ref to context so track() callbacks don't go stale
  const contextRef = useRef<EventProperties>(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Auto page_view on mount
  useEffect(() => {
    if (autoTrack) {
      analytics.trackPageView({ ...contextRef.current, ...pageViewProperties });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount

  const track = useCallback(
    (name: EventName, properties: EventProperties = {}) => {
      analytics.track(name, { ...contextRef.current, ...properties });
    },
    [] // stable — context accessed via ref
  );

  const trackPageView = useCallback((overrides: EventProperties = {}) => {
    analytics.trackPageView({ ...contextRef.current, ...overrides });
  }, []);

  return { track, trackPageView };
}

/**
 * Higher-order helper: attach analytics tracking to any onClick handler.
 *
 * @example
 * <button onClick={trackClick("button_clicked", { label: "Enroll" }, handleEnroll)}>
 *   Enroll
 * </button>
 */
export function trackClick<T extends React.MouseEvent>(
  eventName: EventName,
  properties: EventProperties,
  handler?: (e: T) => void
): (e: T) => void {
  return (e: T) => {
    analytics.track(eventName, properties);
    handler?.(e);
  };
}