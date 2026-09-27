import { describe, expect, it, beforeEach } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAtLeast,
  isAtLeastRole,
  clearAclCaches,
  ROLES_PERMISSIONS,
} from '../acl';
import { UserRole, Permission } from '@/types/api';

describe('ACL caching', () => {
  beforeEach(() => {
    clearAclCaches();
  });

  describe('hasPermission', () => {
    it('returns true for admin with any permission', () => {
      const user = { role: UserRole.ADMIN };
      expect(hasPermission(user, Permission.COURSE_VIEW)).toBe(true);
      expect(hasPermission(user, Permission.COURSE_CREATE)).toBe(true);
      expect(hasPermission(user, Permission.ANALYTICS_VIEW)).toBe(true);
    });

    it('returns true for instructor with allowed permissions', () => {
      const user = { role: UserRole.INSTRUCTOR };
      expect(hasPermission(user, Permission.COURSE_VIEW)).toBe(true);
      expect(hasPermission(user, Permission.COURSE_CREATE)).toBe(true);
      expect(hasPermission(user, Permission.CONTENT_UPLOAD)).toBe(true);
    });

    it('returns false for instructor with admin-only permissions', () => {
      const user = { role: UserRole.INSTRUCTOR };
      expect(hasPermission(user, Permission.ANALYTICS_VIEW)).toBe(false);
      expect(hasPermission(user, Permission.USER_MANAGE)).toBe(false);
    });

    it('returns true for student with allowed permissions', () => {
      const user = { role: UserRole.STUDENT };
      expect(hasPermission(user, Permission.COURSE_VIEW)).toBe(true);
      expect(hasPermission(user, Permission.COURSE_DOWNLOAD)).toBe(true);
      expect(hasPermission(user, Permission.CONTENT_ACCESS)).toBe(true);
    });

    it('returns false for student with instructor permissions', () => {
      const user = { role: UserRole.STUDENT };
      expect(hasPermission(user, Permission.COURSE_CREATE)).toBe(false);
      expect(hasPermission(user, Permission.COURSE_EDIT)).toBe(false);
    });

    it('returns true for guest with course view permission', () => {
      const user = { role: UserRole.GUEST };
      expect(hasPermission(user, Permission.COURSE_VIEW)).toBe(true);
    });

    it('returns false for guest with other permissions', () => {
      const user = { role: UserRole.GUEST };
      expect(hasPermission(user, Permission.COURSE_CREATE)).toBe(false);
      expect(hasPermission(user, Permission.COURSE_DOWNLOAD)).toBe(false);
    });

    it('returns false for null or undefined user', () => {
      expect(hasPermission(null, Permission.COURSE_VIEW)).toBe(false);
      expect(hasPermission(undefined, Permission.COURSE_VIEW)).toBe(false);
    });

    it('caches results for same role and permission', () => {
      const user = { role: UserRole.STUDENT };
      const result1 = hasPermission(user, Permission.COURSE_VIEW);
      const result2 = hasPermission(user, Permission.COURSE_VIEW);
      expect(result1).toBe(result2);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true if user has any of the permissions', () => {
      const user = { role: UserRole.STUDENT };
      expect(hasAnyPermission(user, [Permission.COURSE_VIEW, Permission.COURSE_CREATE])).toBe(true);
      expect(hasAnyPermission(user, [Permission.COURSE_CREATE, Permission.COURSE_VIEW])).toBe(true);
    });

    it('returns false if user has none of the permissions', () => {
      const user = { role: UserRole.GUEST };
      expect(hasAnyPermission(user, [Permission.COURSE_CREATE, Permission.COURSE_EDIT])).toBe(false);
    });

    it('returns false for null or undefined user', () => {
      expect(hasAnyPermission(null, [Permission.COURSE_VIEW])).toBe(false);
      expect(hasAnyPermission(undefined, [Permission.COURSE_VIEW])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true if user has all permissions', () => {
      const user = { role: UserRole.ADMIN };
      expect(hasAllPermissions(user, [Permission.COURSE_VIEW, Permission.COURSE_CREATE])).toBe(true);
    });

    it('returns false if user is missing any permission', () => {
      const user = { role: UserRole.STUDENT };
      expect(hasAllPermissions(user, [Permission.COURSE_VIEW, Permission.COURSE_CREATE])).toBe(false);
    });

    it('returns false for null or undefined user', () => {
      expect(hasAllPermissions(null, [Permission.COURSE_VIEW])).toBe(false);
      expect(hasAllPermissions(undefined, [Permission.COURSE_VIEW])).toBe(false);
    });
  });

  describe('isAtLeast', () => {
    it('returns true for admin at any role', () => {
      const user = { role: UserRole.ADMIN };
      expect(isAtLeast(user, UserRole.ADMIN)).toBe(true);
      expect(isAtLeast(user, UserRole.INSTRUCTOR)).toBe(true);
      expect(isAtLeast(user, UserRole.STUDENT)).toBe(true);
      expect(isAtLeast(user, UserRole.GUEST)).toBe(true);
    });

    it('returns true for instructor at instructor or lower', () => {
      const user = { role: UserRole.INSTRUCTOR };
      expect(isAtLeast(user, UserRole.INSTRUCTOR)).toBe(true);
      expect(isAtLeast(user, UserRole.STUDENT)).toBe(true);
      expect(isAtLeast(user, UserRole.GUEST)).toBe(true);
    });

    it('returns false for instructor at admin', () => {
      const user = { role: UserRole.INSTRUCTOR };
      expect(isAtLeast(user, UserRole.ADMIN)).toBe(false);
    });

    it('returns false for null or undefined user', () => {
      expect(isAtLeast(null, UserRole.GUEST)).toBe(false);
      expect(isAtLeast(undefined, UserRole.GUEST)).toBe(false);
    });
  });

  describe('isAtLeastRole', () => {
    it('returns true for admin at any role', () => {
      expect(isAtLeastRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
      expect(isAtLeastRole(UserRole.ADMIN, UserRole.INSTRUCTOR)).toBe(true);
      expect(isAtLeastRole(UserRole.ADMIN, UserRole.STUDENT)).toBe(true);
      expect(isAtLeastRole(UserRole.ADMIN, UserRole.GUEST)).toBe(true);
    });

    it('returns true for instructor at instructor or lower', () => {
      expect(isAtLeastRole(UserRole.INSTRUCTOR, UserRole.INSTRUCTOR)).toBe(true);
      expect(isAtLeastRole(UserRole.INSTRUCTOR, UserRole.STUDENT)).toBe(true);
      expect(isAtLeastRole(UserRole.INSTRUCTOR, UserRole.GUEST)).toBe(true);
    });

    it('returns false for instructor at admin', () => {
      expect(isAtLeastRole(UserRole.INSTRUCTOR, UserRole.ADMIN)).toBe(false);
    });

    it('returns false for null or undefined role', () => {
      expect(isAtLeastRole(null, UserRole.GUEST)).toBe(false);
      expect(isAtLeastRole(undefined, UserRole.GUEST)).toBe(false);
    });
  });

  describe('clearAclCaches', () => {
    it('clears all caches', () => {
      const user = { role: UserRole.STUDENT };
      hasPermission(user, Permission.COURSE_VIEW);
      isAtLeastRole(UserRole.STUDENT, UserRole.GUEST);
      
      clearAclCaches();
      
      // Should still work correctly after clearing
      expect(hasPermission(user, Permission.COURSE_VIEW)).toBe(true);
      expect(isAtLeastRole(UserRole.STUDENT, UserRole.GUEST)).toBe(true);
    });
  });
});