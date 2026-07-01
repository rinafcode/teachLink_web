// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { User, UserRole, Permission } from '@/types/api';

/**
 * Mapping of roles to their granted permissions.
 */
export const ROLES_PERMISSIONS = {
  ADMIN: Object.values(Permission),
  INSTRUCTOR: [
    Permission.COURSE_VIEW,
    Permission.COURSE_CREATE,
    Permission.COURSE_EDIT,
    Permission.COURSE_DELETE,
    Permission.COURSE_DOWNLOAD,
    Permission.CONTENT_ACCESS,
    Permission.CONTENT_UPLOAD,
  ],
  STUDENT: [Permission.COURSE_VIEW, Permission.COURSE_DOWNLOAD, Permission.CONTENT_ACCESS],
  GUEST: [Permission.COURSE_VIEW],
} satisfies Record<UserRole, Permission[]>;

/**
 * Check if a user has a specific permission based on their role.
 */
export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;

  const permissions = ROLES_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the provided permissions.
 */
export function hasAnyPermission(
  user: User | null | undefined,
  permissions: Permission[],
): boolean {
  if (!user) return false;

  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the provided permissions.
 */
export function hasAllPermissions(
  user: User | null | undefined,
  permissions: Permission[],
): boolean {
  if (!user) return false;

  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has at least the minimum required role.
 * Roles are hierarchical: ADMIN > INSTRUCTOR > STUDENT > GUEST
 */
export function isAtLeast(user: User | null | undefined, role: UserRole): boolean {
  if (!user) return false;

  return isAtLeastRole(user.role, role);
}

/**
 * Check if a role has at least the minimum required role.
 * Roles are hierarchical: ADMIN > INSTRUCTOR > STUDENT > GUEST
 */
export function isAtLeastRole(userRole: UserRole | null | undefined, role: UserRole): boolean {
  if (!userRole) return false;

  const hierarchy = [UserRole.GUEST, UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN];
  const userRoleIndex = hierarchy.indexOf(userRole);
  const requiredRoleIndex = hierarchy.indexOf(role);

  return userRoleIndex >= requiredRoleIndex;
}
