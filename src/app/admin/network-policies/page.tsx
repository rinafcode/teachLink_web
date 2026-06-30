'use client';

import React from 'react';
import { NetworkPolicies } from '@/components/admin/NetworkPolicies';
import AdminThemeToggle from '@/components/admin/AdminThemeToggle';

export default function NetworkPoliciesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Network Policies</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Define IP, CIDR, and country-level access rules for the platform.
            </p>
          </div>
          <AdminThemeToggle />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          {/* user prop can be wired to your auth session provider */}
          <NetworkPolicies user={null} />
        </div>
      </div>
    </div>
  );
}
