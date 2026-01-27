'use client';

import React, { useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface SyncManagerProps {
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

export const SyncManager: React.FC<SyncManagerProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    isOnline,
    isOfflineModeEnabled,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    pendingConflicts,
    syncOfflineData,
    resolveAllConflicts
  } = useOfflineModeContext();

  const statusLabel = useMemo(() => {
    if (!isOnline) return 'Offline';
    if (!isOfflineModeEnabled) return 'Disabled';
    if (syncStatus === 'syncing') return 'Syncing';
    if (syncStatus === 'error') return 'Error';
    return 'Synced';
  }, [isOnline, isOfflineModeEnabled, syncStatus]);

  const StatusIcon = useMemo(() => {
    if (syncStatus === 'syncing') return RefreshCw;
    if (syncStatus === 'error') return AlertTriangle;
    return CheckCircle;
  }, [syncStatus]);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-5 w-5 ${syncStatus === 'syncing' ? 'animate-spin text-blue-600' : 'text-green-600'}`} />
          <div>
            <p className="text-sm font-semibold text-gray-900">Sync manager</p>
            <p className="text-xs text-gray-500">{statusLabel} • Last sync {formatTimeAgo(lastSyncTime)}</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {isOpen ? 'Hide details' : 'View details'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Queued sync items</span>
            <span className="font-semibold text-gray-800">{pendingSyncCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Conflicts</span>
            <span className="font-semibold text-gray-800">{pendingConflicts.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Last sync</span>
            <span className="flex items-center gap-1 text-gray-800">
              <Clock className="h-4 w-4" /> {formatTimeAgo(lastSyncTime)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
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
