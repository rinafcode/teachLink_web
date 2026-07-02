export type UpdateCallback = (registration: ServiceWorkerRegistration) => void;

/**
 * Registers /sw.js and calls `onUpdate` whenever a new service worker is
 * waiting to activate (i.e. an update is available).
 */

import { createLogger } from '@/lib/logging';

const logger = createLogger('service-worker');
export async function registerSW(
  onUpdate?: UpdateCallback,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    const checkForWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        onUpdate?.(reg);
        return;
      }

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdate?.(reg);
          }
        });
      });
    };

    checkForWaiting(registration);

    // Also check on subsequent page loads when a SW may already be waiting
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return registration;
  } catch (err) {
    logger.error('[SW] Registration failed', { error: err });
    return null;
  }
}

/** Tells the waiting service worker to skip waiting and take control. */
export function applyUpdate(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}
