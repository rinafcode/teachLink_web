import { describe, it, expect } from 'vitest';
import {
  SW_CACHE_VERSION,
  isObsoleteCacheName,
  versionedCacheName,
} from '@/utils/swCacheVersion';

describe('versionedCacheName', () => {
  it('namespaces runtime cache names with the current version', () => {
    expect(versionedCacheName('static-js')).toBe(`${SW_CACHE_VERSION}::static-js`);
    expect(versionedCacheName('api-responses')).toBe(`${SW_CACHE_VERSION}::api-responses`);
  });
});

describe('isObsoleteCacheName', () => {
  it('keeps caches created by the current version', () => {
    expect(isObsoleteCacheName(`${SW_CACHE_VERSION}::static-js`)).toBe(false);
    expect(isObsoleteCacheName(`${SW_CACHE_VERSION}::fonts`)).toBe(false);
  });

  it('flags caches created by an older service-worker version', () => {
    expect(isObsoleteCacheName('v1::static-js')).toBe(true);
    expect(isObsoleteCacheName('v1::api-responses')).toBe(true);
  });

  it('flags legacy unversioned caches from before versioning', () => {
    expect(isObsoleteCacheName('static-js')).toBe(true);
    expect(isObsoleteCacheName('offline-fallback')).toBe(true);
    expect(isObsoleteCacheName('fonts')).toBe(true);
  });

  it('leaves workbox-managed caches untouched', () => {
    expect(isObsoleteCacheName('workbox-precache-v2-abc123')).toBe(false);
    expect(isObsoleteCacheName('workbox-background-sync')).toBe(false);
  });

  it('respects an explicit current version', () => {
    expect(isObsoleteCacheName('v3::static-js', 'v3')).toBe(false);
    expect(isObsoleteCacheName('v2::static-js', 'v3')).toBe(true);
  });
});
