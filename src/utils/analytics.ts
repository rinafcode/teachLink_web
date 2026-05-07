// ──────────────────────────────────────────────────────────────────────────────
// analytics.ts  –  Centralised event-tracking service
// ──────────────────────────────────────────────────────────────────────────────
// Usage:
//   import analytics from "@/utils/analytics";
//   analytics.track("course_started", { courseId: "abc" });
//
// Or via hook (auto-attaches page metadata):
//   import { useAnalytics } from "@/hooks/useAnalytics";
//   const { track } = useAnalytics();
//   track("button_clicked", { label: "Enroll" });
// ──────────────────────────────────────────────────────────────────────────────

export type EventName =
  // Navigation
  | 'page_view'
  | 'page_exit'
  // Auth
  | 'login'
  | 'logout'
  | 'signup'
  // Courses
  | 'course_view'
  | 'course_started'
  | 'course_completed'
  | 'lesson_started'
  | 'lesson_completed'
  | 'lesson_skipped'
  // Search
  | 'search_performed'
  | 'search_result_clicked'
  | 'search_no_results'
  // Messaging
  | 'message_sent'
  | 'thread_opened'
  // Notifications
  | 'notification_received'
  | 'notification_clicked'
  | 'notification_dismissed'
  // UI interactions
  | 'button_clicked'
  | 'link_clicked'
  | 'modal_opened'
  | 'modal_closed'
  | 'filter_applied'
  | 'sort_changed'
  // Errors
  | 'error_boundary_triggered'
  | 'api_error'
  // Custom / escape hatch
  | (string & Record<never, never>);

export interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsEvent {
  name: EventName;
  properties: EventProperties;
  timestamp: string; // ISO-8601
  sessionId: string;
  userId?: string;
  anonymousId: string;
}

export type AnalyticsAdapter = (event: AnalyticsEvent) => void | Promise<void>;

// ──────────────────────────────────────────────────────────────────────────────
// Built-in adapters
// ──────────────────────────────────────────────────────────────────────────────

/** Logs to console in development */
export const consoleAdapter: AnalyticsAdapter = (event) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[Analytics] ${event.name}`, event.properties);
  }
};

/** Sends events to your own backend */
export function createApiAdapter(endpoint: string): AnalyticsAdapter {
  return async (event) => {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true, // survive page unload
      });
    } catch (err) {
      console.warn('[Analytics] Failed to send event', err);
    }
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function generateId(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

const SESSION_KEY = '__analytics_session__';
const ANON_KEY = '__analytics_anon__';

function getOrCreate(key: string, factory: () => string): string {
  try {
    return (
      sessionStorage.getItem(key) ??
      (() => {
        const id = factory();
        sessionStorage.setItem(key, id);
        return id;
      })()
    );
  } catch {
    return factory();
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Analytics class
// ──────────────────────────────────────────────────────────────────────────────

class Analytics {
  private adapters: AnalyticsAdapter[] = [consoleAdapter];
  private userId: string | undefined;
  private globalProperties: EventProperties = {};

  private get sessionId(): string {
    return getOrCreate(SESSION_KEY, () => generateId('s_'));
  }

  private get anonymousId(): string {
    try {
      const stored = localStorage.getItem(ANON_KEY);
      if (stored) return stored;
      const id = generateId('a_');
      localStorage.setItem(ANON_KEY, id);
      return id;
    } catch {
      return generateId('a_');
    }
  }

  /** Register an adapter (e.g. Segment, Mixpanel, your own API) */
  addAdapter(adapter: AnalyticsAdapter): this {
    this.adapters.push(adapter);
    return this;
  }

  /** Attach a user identity after login */
  identify(userId: string, traits?: EventProperties): void {
    this.userId = userId;
    if (traits) this.setGlobalProperties(traits);
  }

  /** Clear identity on logout */
  reset(): void {
    this.userId = undefined;
    this.globalProperties = {};
  }

  /** Properties merged into every subsequent event */
  setGlobalProperties(properties: EventProperties): void {
    this.globalProperties = { ...this.globalProperties, ...properties };
  }

  track(name: EventName, properties: EventProperties = {}): void {
    const event: AnalyticsEvent = {
      name,
      properties: { ...this.globalProperties, ...properties },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      anonymousId: this.anonymousId,
      userId: this.userId,
    };

    for (const adapter of this.adapters) {
      try {
        adapter(event);
      } catch (err) {
        console.warn(`[Analytics] Adapter error for "${name}"`, err);
      }
    }
  }

  /** Convenience: track a page view with current URL metadata */
  trackPageView(overrides: EventProperties = {}): void {
    this.track('page_view', {
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || null,
      title: document.title,
      ...overrides,
    });
  }
}

const analytics = new Analytics();
export default analytics;
