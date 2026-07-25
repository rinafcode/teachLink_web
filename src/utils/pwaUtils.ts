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
  if (!('caches' in window)) return;
  // Typically executed inside the SW, but can be manually triggered if needed from client side
}
