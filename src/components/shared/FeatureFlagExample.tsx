'use client';

import { useFeatureFlag } from '@/components/shared/FeatureFlagProvider';
import { Coins, Download, BarChart3, Users, Edit } from 'lucide-react';

/**
 * Example component demonstrating feature flag usage
 */
export function FeatureFlagExample() {
  const tippingEnabled = useFeatureFlag('TIPPING');
  const offlineModeEnabled = useFeatureFlag('OFFLINE_MODE');
  const performanceAnalyticsEnabled = useFeatureFlag('PERFORMANCE_ANALYTICS');
  const daoGovernanceEnabled = useFeatureFlag('DAO_GOVERNANCE');
  const collaborativeEditingEnabled = useFeatureFlag('COLLABORATIVE_EDITING');

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Feature Flag Examples</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tippingEnabled && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Tipping System</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">Send tips to content creators</p>
            <button className="mt-3 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
              Send Tip
            </button>
          </div>
        )}

        {offlineModeEnabled && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Offline Mode</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">Download content for offline viewing</p>
            <button className="mt-3 rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
              Download
            </button>
          </div>
        )}

        {performanceAnalyticsEnabled && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Performance Analytics</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">View detailed performance metrics</p>
            <button className="mt-3 rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700">
              View Metrics
            </button>
          </div>
        )}

        {daoGovernanceEnabled && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">DAO Governance</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">Participate in community governance</p>
            <button className="mt-3 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
              Vote
            </button>
          </div>
        )}

        {collaborativeEditingEnabled && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Collaborative Editing</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">Edit content with others in real-time</p>
            <button className="mt-3 rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700">
              Start Editing
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h3 className="font-semibold">Current Flag Status:</h3>
        <ul className="mt-2 space-y-1 text-sm">
          <li>Tipping: {tippingEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
          <li>Offline Mode: {offlineModeEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
          <li>Performance Analytics: {performanceAnalyticsEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
          <li>DAO Governance: {daoGovernanceEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
          <li>Collaborative Editing: {collaborativeEditingEnabled ? '✅ Enabled' : '❌ Disabled'}</li>
        </ul>
      </div>
    </div>
  );
}