'use client';

import { useSubscriptionConnection } from '@/hooks/useSubscription';
import { ConnectionState } from '@/lib/graphql/subscriptions';
import { WifiOff, Wifi, AlertCircle, RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Real-time status indicator component
 * Shows connection state with visual feedback
 */
export interface ConnectionStatusIndicatorProps {
  /** Show text label */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectionStatusIndicator({
  showLabel = true,
  className = '',
  size = 'md',
}: ConnectionStatusIndicatorProps) {
  const connectionState = useSubscriptionConnection();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    [ConnectionState.CONNECTED]: 'bg-green-500',
    [ConnectionState.CONNECTING]: 'bg-yellow-500 animate-pulse',
    [ConnectionState.RECONNECTING]: 'bg-yellow-500 animate-pulse',
    [ConnectionState.DISCONNECTED]: 'bg-gray-400',
    [ConnectionState.ERROR]: 'bg-red-500 animate-pulse',
  };

  const statusLabels = {
    [ConnectionState.CONNECTED]: 'Connected',
    [ConnectionState.CONNECTING]: 'Connecting...',
    [ConnectionState.RECONNECTING]: 'Reconnecting...',
    [ConnectionState.DISCONNECTED]: 'Disconnected',
    [ConnectionState.ERROR]: 'Connection Error',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`rounded-full ${sizeClasses[size]} ${statusColors[connectionState]}`} />
      {showLabel && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {statusLabels[connectionState]}
        </span>
      )}
    </div>
  );
}

/**
 * Connection status banner component
 * Shows a prominent banner when connection is lost or reconnecting
 */
export interface ConnectionStatusBannerProps {
  /** Show banner on success (default: false) */
  showOnSuccess?: boolean;
  /** Position of the banner */
  position?: 'top' | 'bottom';
  /** Custom action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ConnectionStatusBanner({
  showOnSuccess = false,
  position = 'top',
  action,
}: ConnectionStatusBannerProps) {
  const connectionState = useSubscriptionConnection();

  if (
    connectionState === ConnectionState.CONNECTED &&
    !showOnSuccess
  ) {
    return null;
  }

  const bannerConfig = {
    [ConnectionState.CONNECTED]: {
      show: showOnSuccess,
      icon: <Wifi className="w-4 h-4" />,
      text: 'Real-time connection established',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
    },
    [ConnectionState.CONNECTING]: {
      show: true,
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      text: 'Establishing real-time connection...',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
    },
    [ConnectionState.RECONNECTING]: {
      show: true,
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      text: 'Reconnecting to real-time service...',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
    },
    [ConnectionState.DISCONNECTED]: {
      show: true,
      icon: <WifiOff className="w-4 h-4" />,
      text: 'Real-time updates disabled. Using periodic updates.',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      textColor: 'text-gray-800 dark:text-gray-200',
    },
    [ConnectionState.ERROR]: {
      show: true,
      icon: <AlertCircle className="w-4 h-4" />,
      text: 'Connection lost. Retrying...',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
    },
  };

  const config = bannerConfig[connectionState];

  if (!config.show) {
    return null;
  }

  const positionClasses = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <div
      className={`fixed ${positionClasses} left-0 right-0 border-b ${config.borderColor} ${config.bgColor} ${config.textColor} px-4 py-3 flex items-center justify-between gap-4 z-40`}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <span className="text-sm font-medium">{config.text}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-auto px-3 py-1 rounded text-sm font-medium hover:opacity-80 transition-opacity"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Loading state for subscription data
 */
export interface SubscriptionLoadingProps {
  loading: boolean;
  children: ReactNode;
  /** Fallback UI while loading */
  fallback?: ReactNode;
  /** Error state to display */
  error?: Error | null;
}

export function SubscriptionLoadingState({
  loading,
  children,
  fallback,
  error,
}: SubscriptionLoadingProps) {
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Real-time update failed</p>
          <p className="text-xs mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (loading && fallback) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Real-time data updated indicator
 * Shows when data has been updated in real-time
 */
export interface RealtimeUpdateIndicatorProps {
  /** Show the indicator */
  show: boolean;
  /** Duration to show the indicator (ms) */
  duration?: number;
  /** Custom message */
  message?: string;
}

export function RealtimeUpdateIndicator({
  show,
  duration = 2000,
  message = '✓ Updated',
}: RealtimeUpdateIndicatorProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-out">
      {message}
    </div>
  );
}

/**
 * Fallback UI component for pending subscriptions
 */
export function SubscriptionSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20 animate-pulse" />
      ))}
    </div>
  );
}
