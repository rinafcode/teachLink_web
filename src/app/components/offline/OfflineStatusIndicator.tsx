'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Settings,
  Download,
  Upload,
  HardDrive,
  Clock,
  Trash2
} from 'lucide-react';
import { useOfflineModeContext } from '../../context/OfflineModeContext';

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({ 
  className = '',
  showDetails = true 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    isOnline,
    isOfflineModeEnabled,
    syncStatus,
    lastSyncTime,
    pendingSyncCount,
    storageUsage,
    enableOfflineMode,
    disableOfflineMode,
    syncOfflineData,
    clearOfflineData
  } = useOfflineModeContext();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
    
    if (!isOfflineModeEnabled) {
      return <Wifi className="w-4 h-4 text-gray-400" />;
    }

    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }
    
    if (!isOfflineModeEnabled) {
      return 'Online';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync Error';
      default:
        return 'Online';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'text-red-500';
    }
    
    if (!isOfflineModeEnabled) {
      return 'text-gray-400';
    }

    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-500';
      case 'synced':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSync = async () => {
    if (isOnline && isOfflineModeEnabled) {
      await syncOfflineData();
    }
  };

  const handleToggleOfflineMode = async () => {
    if (isOfflineModeEnabled) {
      await disableOfflineMode();
    } else {
      await enableOfflineMode();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Status Indicator */}
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {getStatusIcon()}
        {showDetails && (
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        )}
        {pendingSyncCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {pendingSyncCount}
          </span>
        )}
      </button>

      {/* Tooltip/Details Panel */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Offline Status</h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Connection Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection</span>
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Offline Mode Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Offline Mode</span>
                  <div className="flex items-center space-x-2">
                    {isOfflineModeEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {isOfflineModeEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Sync Status */}
                {isOfflineModeEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sync Status</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon()}
                      <span className="text-sm font-medium capitalize">
                        {syncStatus}
                      </span>
                    </div>
                  </div>
                )}

                {/* Last Sync */}
                {isOfflineModeEnabled && lastSyncTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Sync</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {formatTime(lastSyncTime)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Pending Sync */}
                {pendingSyncCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Sync</span>
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-600">
                        {pendingSyncCount} items
                      </span>
                    </div>
                  </div>
                )}

                {/* Storage Usage */}
                {isOfflineModeEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Storage</span>
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">
                          {formatStorage(storageUsage.used)} / {formatStorage(storageUsage.total)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(storageUsage.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {isOfflineModeEnabled ? (
                  <>
                    <button
                      onClick={handleSync}
                      disabled={!isOnline || syncStatus === 'syncing'}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Sync Now</span>
                    </button>
                    <button
                      onClick={handleToggleOfflineMode}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <Wifi className="w-4 h-4" />
                      <span>Disable Offline Mode</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleToggleOfflineMode}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Download className="w-4 h-4" />
                    <span>Enable Offline Mode</span>
                  </button>
                )}
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Settings</h4>
                    <div className="space-y-2">
                      <button
                        onClick={clearOfflineData}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear Offline Data</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
