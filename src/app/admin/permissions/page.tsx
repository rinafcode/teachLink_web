'use client';

import React from 'react';
import { ROLES_PERMISSIONS } from '@/lib/auth/acl';
import { UserRole, Permission } from '@/types/api';
import { Shield, Check, X, Info } from 'lucide-react';

export default function PermissionsManagementPage() {
  const roles = Object.keys(ROLES_PERMISSIONS) as UserRole[];
  const allPermissions = Object.values(Permission);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Access Control Lists (ACL)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage granular permissions for each user role in the system.
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800 max-w-md">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Permissions are currently read-only in this version. 
              Changes must be applied to the <code>acl.ts</code> configuration.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50">
              <th className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                Permission / Role
              </th>
              {roles.map((role) => (
                <th 
                  key={role} 
                  className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-center text-gray-900 dark:text-white"
                >
                  <span className={`px-3 py-1 rounded-full text-xs uppercase ${getRoleColor(role)}`}>
                    {role}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPermissions.map((permission) => (
              <tr 
                key={permission} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-gray-800 dark:text-gray-200">{permission}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{getPermissionDesc(permission)}</div>
                </td>
                {roles.map((role) => {
                  const hasAccess = ROLES_PERMISSIONS[role].includes(permission);
                  return (
                    <td 
                      key={`${role}-${permission}`} 
                      className="p-4 border-b border-gray-200 dark:border-gray-700 text-center"
                    >
                      {hasAccess ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
                          <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN: return 'bg-purple-100 text-purple-700 border border-purple-200';
    case UserRole.INSTRUCTOR: return 'bg-blue-100 text-blue-700 border border-blue-200';
    case UserRole.STUDENT: return 'bg-green-100 text-green-700 border border-green-200';
    default: return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}

function getPermissionDesc(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    [Permission.COURSE_VIEW]: 'View and browse available courses',
    [Permission.COURSE_CREATE]: 'Create new learning courses',
    [Permission.COURSE_EDIT]: 'Modify existing courses and content',
    [Permission.COURSE_DELETE]: 'Permanently remove courses',
    [Permission.COURSE_DOWNLOAD]: 'Download courses for offline access',
    [Permission.USER_VIEW]: 'View other users in the system',
    [Permission.USER_MANAGE]: 'Edit user roles and account statuses',
    [Permission.CONTENT_ACCESS]: 'Access premium learning materials',
    [Permission.CONTENT_UPLOAD]: 'Upload videos and documents',
    [Permission.SYSTEM_SETTINGS]: 'Modify global platform configuration',
    [Permission.ANALYTICS_VIEW]: 'View learning and engagement metrics',
  };
  return descriptions[permission] || 'No description available';
}
