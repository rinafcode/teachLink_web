import { User, UserRole, Permission } from '@/types/api';

/**
 * Minimal object required by many auth checks: only the role is required.
 * This allows callers that only have a partial user (AuthUser) to pass through.
 */
type RoleHolder = { role: UserRole };

/**
 * Mapping of roles to their granted permissions.
 */
export const ROLES_PERMISSIONS: Record<UserRole, Permission[]> = {
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
};

/**
 * Check if a user (or any object that contains a role) has a specific permission.
 */
export function hasPermission(user: RoleHolder | null | undefined, permission: Permission): boolean {
  if (!user) return false;

  const permissions = ROLES_PERMISSIONS[user.role] ?? [];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the provided permissions.
 */
export function hasAnyPermission(
  user: RoleHolder | null | undefined,
  permissions: Permission[],
): boolean {
  if (!user) return false;

  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has all of the provided permissions.
 */
export function hasAllPermissions(
  user: RoleHolder | null | undefined,
  permissions: Permission[],
): boolean {
  if (!user) return false;

  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Check if a user has at least the minimum required role.
 * Roles are hierarchical: ADMIN > INSTRUCTOR > STUDENT > GUEST
 */
export function isAtLeast(user: RoleHolder | null | undefined, role: UserRole): boolean {
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