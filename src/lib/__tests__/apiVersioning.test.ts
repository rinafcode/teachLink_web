/**
 * Unit tests for API versioning helpers.
 */

import { describe, expect, it } from 'vitest';
import { getApiDeprecationInfo, getVersionedApiPath } from '../apiVersioning';

describe('getApiDeprecationInfo', () => {
  describe('versioned API paths — no warning', () => {
    it('returns null for /api/v1/* paths', () => {
      expect(getApiDeprecationInfo('/api/v1/notes')).toBeNull();
    });

    it('returns null for any valid version segment', () => {
      expect(getApiDeprecationInfo('/api/v2/posts')).toBeNull();
      expect(getApiDeprecationInfo('/api/v10/posts')).toBeNull();
    });

    it('returns null for a bare version root like /api/v1', () => {
      expect(getApiDeprecationInfo('/api/v1')).toBeNull();
    });
  });

  describe('non-API paths — no warning', () => {
    it('returns null for paths outside /api', () => {
      expect(getApiDeprecationInfo('/notes')).toBeNull();
      expect(getApiDeprecationInfo('/admin/dashboard')).toBeNull();
    });
  });

  describe('unversioned API paths — warning emitted', () => {
    it('suggests the versioned equivalent for /api/notes', () => {
      const info = getApiDeprecationInfo('/api/notes');

      expect(info).not.toBeNull();
      expect(info?.deprecatedPath).toBe('/api/notes');
      expect(info?.versionedPath).toBe('/api/v1/notes');
      expect(info?.message).toContain('/api/notes');
      expect(info?.message).toContain('/api/v1/notes');
    });

    it('handles the bare /api root', () => {
      expect(getApiDeprecationInfo('/api')?.versionedPath).toBe('/api/v1');
      expect(getApiDeprecationInfo('/api/')?.versionedPath).toBe('/api/v1/');
    });

    it('preserves sub-paths when constructing the target', () => {
      const info = getApiDeprecationInfo('/api/courses/123/lessons?foo=bar');
      expect(info?.versionedPath).toBe('/api/v1/courses/123/lessons?foo=bar');
    });
  });

  describe('malformed version segments — warning emitted', () => {
    it('warns for alphabetic segment (vABC)', () => {
      const info = getApiDeprecationInfo('/api/vABC/posts');
      expect(info?.deprecatedPath).toBe('/api/vABC/posts');
      expect(info?.versionedPath).toBe('/api/v1/vABC/posts');
    });

    it('warns for dotted segment (v1.2)', () => {
      expect(getApiDeprecationInfo('/api/v1.2/posts')).not.toBeNull();
    });

    it('warns for purely numeric segment (123)', () => {
      expect(getApiDeprecationInfo('/api/123/posts')).not.toBeNull();
    });

    it('warns for an empty version segment (/api/v/)', () => {
      expect(getApiDeprecationInfo('/api/v/posts')).not.toBeNull();
    });
  });
});

describe('getVersionedApiPath', () => {
  it('upgrades unversioned /api/* paths', () => {
    expect(getVersionedApiPath('/api/courses')).toBe('/api/v1/courses');
  });

  it('leaves versioned paths unchanged', () => {
    expect(getVersionedApiPath('/api/v1/courses')).toBe('/api/v1/courses');
  });

  it('leaves non-API paths unchanged', () => {
    expect(getVersionedApiPath('/courses')).toBe('/courses');
  });
});
