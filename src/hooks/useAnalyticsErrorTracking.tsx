/**
 * useAnalyticsErrorTracking Hook
 * Provides comprehensive error tracking for Dashboard Analytics with automatic reporting,
 * error categorization, and recovery mechanisms
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Error types for analytics-specific errors
export type AnalyticsErrorType =
  | 'DATA_FETCH_ERROR'
  | 'WEBSOCKET_CONNECTION_ERROR'
  | 'CHART_RENDERING_ERROR'
  | 'DATA_PROCESSING_ERROR'
  | 'EXPORT_ERROR'
  | 'REAL_TIME_SYNC_ERROR'
  | 'FILTER_APPLICATION_ERROR'
  | 'DASHBOARD_SHARE_ERROR';

export interface AnalyticsErrorContext {
  componentName?: string;
  chartId?: string;
  panelId?: string;
  timeRange?: string;
  aggregation?: string;
  websocketUrl?: string;
  userId?: string;
  sessionId: string;
  url: string;
  environment: string;
  metadata?: Record<string, unknown>;
}

export interface TrackedError {
  id: string;
  type: AnalyticsErrorType;
  message: string;
  timestamp: Date;
  context: AnalyticsErrorContext;
  stack?: string;
  handled: boolean;
  recovered: boolean;
}

export interface UseAnalyticsErrorTrackingReturn {
  errors: TrackedError[];
  hasErrors: boolean;
  trackError: (
    type: AnalyticsErrorType,
    message: string,
    additionalContext?: Partial<AnalyticsErrorContext>,
    error?: Error,
  ) => void;
  clearErrors: () => void;
  dismissError: (errorId: string) => void;
  getErrorsByType: (type: AnalyticsErrorType) => TrackedError[];
  getLatestError: () => TrackedError | null;
  resetRecoveryState: () => void;
}

const defaultContext: AnalyticsErrorContext = {
  sessionId: '',
  url: '',
  environment: process.env.NODE_ENV || 'development',
};

// Generate a persistent session ID for the user's dashboard session
const getOrCreateSessionId = (): string => {
  if (typeof window !== 'undefined') {
    const existing = sessionStorage.getItem('analytics_session_id');
    if (existing) return existing;
    const newId = uuidv4();
    sessionStorage.setItem('analytics_session_id', newId);
    return newId;
  }
  return uuidv4();
};

export const useAnalyticsErrorTracking = (
  baseContext?: Partial<AnalyticsErrorContext>,
): UseAnalyticsErrorTrackingReturn => {
  const [errors, setErrors] = useState<TrackedError[]>([]);
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const hasReportedRef = useRef<Set<string>>(new Set());

  // Initialize base context
  const getBaseContext = useCallback((): AnalyticsErrorContext => {
    return {
      ...defaultContext,
      sessionId: sessionIdRef.current,
      url: typeof window !== 'undefined' ? window.location.href : '',
      ...baseContext,
    };
  }, [baseContext]);

  // Send error to server-side reporting API
  const reportErrorToServer = useCallback(async (trackedError: TrackedError) => {
    // Prevent duplicate reports for the same error instance
    if (hasReportedRef.current.has(trackedError.id)) return;
    hasReportedRef.current.add(trackedError.id);

    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: trackedError.id,
          sessionId: trackedError.context.sessionId,
          userId: trackedError.context.userId,
          url: trackedError.context.url,
          environment: trackedError.context.environment,
          errorData: {
            type: trackedError.type,
            message: trackedError.message,
            stack: trackedError.stack,
          },
          context: {
            component: trackedError.context.componentName,
            chartId: trackedError.context.chartId,
            panelId: trackedError.context.panelId,
            timeRange: trackedError.context.timeRange,
            aggregation: trackedError.context.aggregation,
            ...trackedError.context.metadata,
          },
        }),
      });
    } catch (reportingErr) {
      // Fail silently - don't create an infinite loop of error reporting
      console.warn('Failed to report error to server:', reportingErr);
    }
  }, []);

  // Main error tracking function
  const trackError = useCallback(
    (
      type: AnalyticsErrorType,
      message: string,
      additionalContext?: Partial<AnalyticsErrorContext>,
      error?: Error,
    ) => {
      const newError: TrackedError = {
        id: uuidv4(),
        type,
        message,
        timestamp: new Date(),
        context: {
          ...getBaseContext(),
          ...additionalContext,
        },
        stack: error?.stack,
        handled: true,
        recovered: false,
      };

      setErrors((prev) => [...prev, newError]);

      // Report to server asynchronously
      void reportErrorToServer(newError);

      // Log to console in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`[Analytics Error] ${type}: ${message}`, {
          error,
          context: newError.context,
        });
      }
    },
    [getBaseContext, reportErrorToServer],
  );

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const dismissError = useCallback((errorId: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== errorId));
  }, []);

  const getErrorsByType = useCallback(
    (type: AnalyticsErrorType) => {
      return errors.filter((e) => e.type === type);
    },
    [errors],
  );

  const getLatestError = useCallback(() => {
    if (errors.length === 0) return null;
    return [...errors].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }, [errors]);

  const resetRecoveryState = useCallback(() => {
    setErrors((prev) =>
      prev.map((e) => ({
        ...e,
        recovered: true,
      })),
    );
  }, []);

  // Clean up old errors (keep only last 50 errors in state)
  useEffect(() => {
    if (errors.length > 50) {
      setErrors((prev) => prev.slice(-50));
    }
  }, [errors.length]);

  return {
    errors,
    hasErrors: errors.length > 0,
    trackError,
    clearErrors,
    dismissError,
    getErrorsByType,
    getLatestError,
    resetRecoveryState,
  };
};
