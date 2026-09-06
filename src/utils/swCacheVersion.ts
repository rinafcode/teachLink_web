/**
 * Shared service-worker cache versioning.
 *
 * Bump `SW_CACHE_VERSION` whenever the app shell or cached assets change so
 * that the installed service worker starts writing to a fresh cache namespace
 * and purges caches created by older versions during the activate lifecycle.
 * This prevents stale assets from persisting after a deploy.
 */

export const SW_CACHE_VERSION = 'v2';

/** Namespace a runtime cache name with the current service-worker version. */
export const versionedCacheName = (name: string): string => `${SW_CACHE_VERSION}::${name}`;

/**
 * Runtime cache names that predate versioning. They are cleaned up once so the
 * upgrade to versioned namespaces is not left with orphaned stale assets.
 */
const LEGACY_UNVERSIONED_CACHES = [
  'offline-fallback',
  'static-js',
  'static-css',
  'images',
  'images-ext',
  'external-images',
  'api-responses',
  'fonts',
] as const;

/**
 * True when a cache should be deleted during the activate lifecycle:
 *  - caches created by an older service-worker version (e.g. `v1::static-js`),
 *  - legacy unversioned caches from before versioning was introduced.
 *
 * Workbox-managed caches (e.g. `workbox-precache-v2-...`) are left untouched.
 */
export const isObsoleteCacheName = (
  name: string,
  currentVersion: string = SW_CACHE_VERSION,
): boolean => {
  if (name.startsWith(`${currentVersion}::`)) return false;
  if ((LEGACY_UNVERSIONED_CACHES as readonly string[]).includes(name)) return true;
  // Versioned namespace from an older service-worker version.
  return /^v\d+::/.test(name);
};
