import { User, UserRole, Permission } from '@/types/api';

/**
 * Mapping of roles to their granted permissions.
 */
export const ROLES_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  [UserRole.INSTRUCTOR]: [
    Permission.COURSE_VIEW,
    Permission.COURSE_CREATE,
    Permission.COURSE_EDIT,
    Permission.COURSE_DELETE,
    Permission.COURSE_DOWNLOAD,
    Permission.CONTENT_ACCESS,
    Permission.CONTENT_UPLOAD,
    Permission.ANALYTICS_VIEW,
  ],
  [UserRole.STUDENT]: [
    Permission.COURSE_VIEW,
    Permission.COURSE_DOWNLOAD,
    Permission.CONTENT_ACCESS,
  ],
  [UserRole.GUEST]: [
    Permission.COURSE_VIEW,
  ],
};

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
export function hasAnyPermission(user: User | null | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if a user has all of the provided permissions.
 */
export function hasAllPermissions(user: User | null | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if a user has at least the minimum required role.
 * Roles are hierarchical: ADMIN > INSTRUCTOR > STUDENT > GUEST
 */
export function isAtLeast(user: User | null | undefined, role: UserRole): boolean {
  if (!user) return false;
  
  const hierarchy = [UserRole.GUEST, UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN];
  const userRoleIndex = hierarchy.indexOf(user.role);
  const requiredRoleIndex = hierarchy.indexOf(role);
  
  return userRoleIndex >= requiredRoleIndex;
}
