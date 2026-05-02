/**
 * Registers the service worker for PWA offline capabilities
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed: ', error);
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
    console.error('Error prompting PWA install:', err);
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