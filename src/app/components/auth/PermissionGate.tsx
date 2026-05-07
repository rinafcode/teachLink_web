'use client';

import React from 'react';
import { Permission, User } from '@/types/api';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth/acl';

interface PermissionGateProps {
  children: React.ReactNode;
  user: User | null | undefined;
  permission?: Permission;
  anyPermission?: Permission[];
  allPermissions?: Permission[];
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on user permissions.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  user,
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
}) => {
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(user, permission);
  } else if (anyPermission) {
    hasAccess = hasAnyPermission(user, anyPermission);
  } else if (allPermissions) {
    hasAccess = hasAllPermissions(user, allPermissions);
  } else {
    // If no permission is specified, default to no access unless intentionally allowed
    hasAccess = false;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
