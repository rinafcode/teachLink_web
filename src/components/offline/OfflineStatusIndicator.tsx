'use client';

import React, { useMemo, useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  CloudOff,
  Cloud
} from 'lucide-react';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface OfflineStatusIndicatorProps {
  className?: string;
}

const formatTimeAgo = (timestamp: string | null) => {
  if (!timestamp) return 'Never';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({ className = '' }) => {
  const [showPanel, setShowPanel] = useState(false);

  const {
    isOnline,
    isOfflineModeEnabled,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    pendingConflicts,
    enableOfflineMode,
    disableOfflineMode,
    syncOfflineData,
    resolveAllConflicts
  } = useOfflineModeContext();

  const statusLabel = useMemo(() => {
    if (!isOnline) return 'Offline';
    if (!isOfflineModeEnabled) return 'Online';
    if (syncStatus === 'syncing') return 'Syncing';
    if (syncStatus === 'error') return 'Sync error';
    return 'Synced';
  }, [isOnline, isOfflineModeEnabled, syncStatus]);

  const StatusIcon = useMemo(() => {
    if (!isOnline) return WifiOff;
    if (!isOfflineModeEnabled) return Wifi;
    if (syncStatus === 'syncing') return RefreshCw;
    if (syncStatus === 'error') return AlertTriangle;
    return CheckCircle;
  }, [isOnline, isOfflineModeEnabled, syncStatus]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowPanel(prev => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm"
      >
        <StatusIcon className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin text-blue-600' : ''}`} />
        {statusLabel}
        {pendingSyncCount > 0 && (
          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
            {pendingSyncCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Offline status</p>
              <p className="text-xs text-gray-500">Last sync {formatTimeAgo(lastSyncTime)}</p>
            </div>
            {isOnline ? <Cloud className="h-5 w-5 text-green-500" /> : <CloudOff className="h-5 w-5 text-red-500" />}
          </div>

          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Connection</span>
              <span className="font-semibold text-gray-800">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Offline mode</span>
              <span className="font-semibold text-gray-800">{isOfflineModeEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sync status</span>
              <span className="font-semibold text-gray-800 capitalize">{syncStatus}</span>
            </div>
            {pendingConflicts.length > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span>Conflicts</span>
                <span className="font-semibold">{pendingConflicts.length}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={isOfflineModeEnabled ? disableOfflineMode : enableOfflineMode}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {isOfflineModeEnabled ? 'Disable offline' : 'Enable offline'}
            </button>
            <button
              onClick={() => syncOfflineData()}
              disabled={!isOnline || !isOfflineModeEnabled}
              className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Sync now
            </button>
            {pendingConflicts.length > 0 && (
              <button
                onClick={() => resolveAllConflicts('local')}
                className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
              >
                Resolve conflicts
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
