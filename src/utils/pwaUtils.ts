/**
 * Registers the service worker for PWA offline capabilities
 */

import { createLogger } from '@/lib/logging';

const logger = createLogger('pwa-utils');
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      logger.info('ServiceWorker registration successful', { scope: registration.scope });
      return registration;
    } catch (error) {
      logger.error('ServiceWorker registration failed', { error });
      return undefined;
    }
  }
  return undefined;
}

/**
 * Checks if the browser supports required offline features
 */
export function checkOfflineCapabilities(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'indexedDB' in window && 'caches' in window;
}

/**
 * Handles the PWA install prompt. Pass the stored BeforeInstallPromptEvent.
 */
export async function promptPWAInstall(installEvent: any): Promise<boolean> {
  if (!installEvent) return false;

  try {
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    return outcome === 'accepted';
  } catch (err) {
    logger.error('Error prompting PWA install', { error: err });
    return false;
  }
}

/**
 * Clears outdated caches for storage optimization on mobile
 */
export async function clearOutdatedCaches(cachePrefix = 'teachlink-cache-'): Promise<void> {
  if (typeof globalThis === 'undefined' || !('caches' in globalThis)) return;

  try {
    const cacheNames = await globalThis.caches.keys();
    const matchingCaches = cacheNames.filter((cacheName) => cacheName.startsWith(cachePrefix));

    await Promise.all(matchingCaches.map((cacheName) => globalThis.caches.delete(cacheName)));
    logger.info('Cleared outdated caches', { cachePrefix, deletedCount: matchingCaches.length });
  } catch (error) {
    logger.error('Failed to clear outdated caches', { error, cachePrefix });
  }
}

/**
 * Default settle time for connectivity changes.
 *
 * A flapping connection — a train tunnel, a wifi handover — fires `online` and
 * `offline` several times a second. Reacting to each one starts a sync that is
 * cancelled by the next event, so nothing ever drains.
 */
export const CONNECTIVITY_DEBOUNCE_MS = 1500;

export interface ConnectivityDebouncerOptions {
  /** How long the state must hold before it is reported. */
  debounceMs?: number;
  /** Injectable timers, so tests need not wait in real time. */
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

export interface ConnectivityDebouncer {
  /** Feed a raw connectivity event. */
  push: (online: boolean) => void;
  /** The last settled value reported to the callback. */
  readonly settled: boolean;
  /** The most recent raw value, settled or not. */
  readonly pending: boolean;
  /** Report the pending value immediately, cancelling the timer. */
  flush: () => void;
  /** Cancel any pending report. */
  cancel: () => void;
}

/**
 * Debounces connectivity transitions, reporting only states that hold.
 *
 * Two properties matter beyond plain debouncing:
 *
 * - A value equal to the last settled one cancels the pending timer instead of
 *   restarting it. Offline → online → offline within the window is not a
 *   change at all, and should not fire a callback.
 * - The callback fires only on an actual change, so a run of `online` events
 *   on an already-online connection stays silent.
 */
export function createConnectivityDebouncer(
  initialOnline: boolean,
  onChange: (online: boolean) => void,
  options: ConnectivityDebouncerOptions = {},
): ConnectivityDebouncer {
  const debounceMs = options.debounceMs ?? CONNECTIVITY_DEBOUNCE_MS;
  const setTimer = options.setTimeoutFn ?? setTimeout;
  const clearTimer = options.clearTimeoutFn ?? clearTimeout;

  let settled = initialOnline;
  let pending = initialOnline;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  };

  const commit = () => {
    timer = null;
    if (pending === settled) return;
    settled = pending;
    onChange(settled);
  };

  return {
    push(online: boolean) {
      pending = online;

      // Back to where we started: the flap cancelled itself out.
      if (online === settled) {
        cancel();
        return;
      }

      cancel();
      timer = setTimer(commit, debounceMs);
    },
    get settled() {
      return settled;
    },
    get pending() {
      return pending;
    },
    flush() {
      cancel();
      commit();
    },
    cancel,
  };
}
