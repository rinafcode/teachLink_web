import { CACHE_VERSION, CURRENT_CACHES } from '../serviceWorker';

describe('ServiceWorker Configuration (Issues #915, #916, #917)', () => {
  it('defines cache version and current caches map', () => {
    expect(CACHE_VERSION).toBe('v1');
    expect(CURRENT_CACHES.js).toBe('static-js-v1');
    expect(CURRENT_CACHES.css).toBe('static-css-v1');
    expect(CURRENT_CACHES.offlineFallback).toBe('offline-fallback-v1');
  });

  it('includes all required cache keys in CURRENT_CACHES', () => {
    expect(CURRENT_CACHES).toHaveProperty('js');
    expect(CURRENT_CACHES).toHaveProperty('css');
    expect(CURRENT_CACHES).toHaveProperty('images');
    expect(CURRENT_CACHES).toHaveProperty('api');
    expect(CURRENT_CACHES).toHaveProperty('offlineFallback');
  });
});
