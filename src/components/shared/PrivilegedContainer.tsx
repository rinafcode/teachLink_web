import React from 'react';
import { UserRole } from '@/types/api';
import { isAtLeastRole } from '@/lib/auth/acl';

interface PrivilegedContainerProps {
  userRole: UserRole | null | undefined;
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback: React.ReactNode;
  className?: string;
}

export function PrivilegedContainer({
  userRole,
  requiredRole,
  children,
  fallback,
  className,
}: PrivilegedContainerProps) {
  const isAllowed = isAtLeastRole(userRole, requiredRole);

  return <div className={className}>{isAllowed ? children : fallback}</div>;
}
