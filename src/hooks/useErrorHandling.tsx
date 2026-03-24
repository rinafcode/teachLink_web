/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Custom Hook for Error Handling
 * Provides comprehensive error state management and handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { errorReportingService } from '@/services/errorReporting';
import {
  isRetryable,
  getUserFriendlyMessage,
  getActionSuggestion,
  retryWithBackoff,
  classifyError,
} from '@/utils/errorUtils';

export interface UseErrorHandlingState {
  error: any | null;
  isLoading: boolean;
  attempts: number;
  isRetrying: boolean;
  userMessage: string;
  actionSuggestion?: string;
  isRetryable: boolean;
}

export interface UseErrorHandlingOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  onError?: (error: any) => void;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  reportErrors?: boolean;
}

/**
 * Hook for managing error states and operations
 */
export function useErrorHandling(options: UseErrorHandlingOptions = {}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffFactor = 2,
    onError,
    onRetry,
    onSuccess,
    reportErrors = true,
  } = options;

  const [state, setState] = useState<UseErrorHandlingState>({
    error: null,
    isLoading: false,
    attempts: 0,
    isRetrying: false,
    userMessage: '',
    actionSuggestion: undefined,
    isRetryable: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: any) => {
    const userMessage = getUserFriendlyMessage(error);
    const actionSuggestion = getActionSuggestion(error);
    const isRetry = isRetryable(error);

    setState(prev => ({
      ...prev,
      error,
      userMessage,
      actionSuggestion,
      isRetryable: isRetry,
      isLoading: false,
    }));

    if (reportErrors) {
      errorReportingService.reportError(error).catch(console.error);
    }

    onError?.(error);
  }, [reportErrors, onError]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      userMessage: '',
      actionSuggestion: undefined,
      isRetryable: false,
      attempts: 0,
    }));
  }, []);

  /**
   * Execute async function with error handling and retry logic
   */
  const execute = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      setState(prev => ({
        ...prev,
        isLoading: true,
        attempts: 0,
      }));

      try {
        const result = await retryWithBackoff(
          async () => {
            setState(prev => ({
              ...prev,
              attempts: prev.attempts + 1,
              isRetrying: prev.attempts > 0,
            }));

            onRetry?.(state.attempts + 1);
            return fn();
          },
          {
            maxAttempts,
            initialDelayMs,
            maxDelayMs,
            backoffFactor,
          }
        );

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          userMessage: '',
          isRetrying: false,
        }));

        onSuccess?.();
        return result;
      } catch (error) {
        setError(error);
        return null;
      }
    },
    [maxAttempts, initialDelayMs, maxDelayMs, backoffFactor, onRetry, onSuccess, setError, state.attempts]
  );

  /**
   * Execute async function with abort capability
   */
  const executeWithAbort = useCallback(
    async <T,>(fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        isLoading: true,
      }));

      try {
        const result = await fn(abortControllerRef.current.signal);

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        onSuccess?.();
        return result;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setError(error);
        }
        return null;
      }
    },
    [onSuccess, setError]
  );

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async () => {
    if (!state.error || !state.isRetryable) {
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      attempts: prev.attempts + 1,
    }));

    // Retry logic would be handled by the original execute call
    // This is a placeholder for manual retry
  }, [state.error, state.isRetryable]);

  /**
   * Cancel ongoing operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      isRetrying: false,
    }));
  }, []);

  /**
   * Report analytics
   */
  const reportMetric = useCallback((name: string, value: number, unit?: string) => {
    errorReportingService.reportMetric(name, value, unit);
  }, []);

  /**
   * Report user action
   */
  const reportAction = useCallback((action: string, details?: Record<string, any>) => {
    errorReportingService.reportUserAction(action, details);
  }, []);

  return {
    // State
    ...state,

    // Actions
    setError,
    clearError,
    execute,
    executeWithAbort,
    retry,
    cancel,
    reportMetric,
    reportAction,
  };
}

/**
 * Hook for form error handling
 */
export function useFormErrorHandling() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const setFieldError = useCallback((fieldName: string, error: any) => {
    const message = getUserFriendlyMessage(error);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: message,
    }));
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback((fieldName: string) => {
    return !!fieldErrors[fieldName];
  }, [fieldErrors]);

  const getFieldError = useCallback((fieldName: string) => {
    return fieldErrors[fieldName];
  }, [fieldErrors]);

  return {
    fieldErrors,
    generalError,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldError,
    getFieldError,
    setGeneralError,
    clearGeneralError: () => setGeneralError(null),
  };
}

/**
 * Hook for managing multiple async operations with error handling
 */
export function useAsyncOperations() {
  const [operations, setOperations] = useState<
    Record<
      string,
      {
        isLoading: boolean;
        error: any | null;
        data: any;
      }
    >
  >({});

  const setOperationLoading = useCallback((operationId: string, isLoading: boolean) => {
    setOperations(prev => ({
      ...prev,
      [operationId]: {
        ...prev[operationId],
        isLoading,
      },
    }));
  }, []);

  const setOperationError = useCallback((operationId: string, error: any) => {
    setOperations(prev => ({
      ...prev,
      [operationId]: {
        ...prev[operationId],
        error,
        isLoading: false,
      },
    }));
  }, []);

  const setOperationData = useCallback((operationId: string, data: any) => {
    setOperations(prev => ({
      ...prev,
      [operationId]: {
        ...prev[operationId],
        data,
        error: null,
        isLoading: false,
      },
    }));
  }, []);

  const executeOperation = useCallback(
    async <T,>(operationId: string, fn: () => Promise<T>): Promise<T | null> => {
      setOperationLoading(operationId, true);

      try {
        const result = await fn();
        setOperationData(operationId, result);
        return result;
      } catch (error) {
        setOperationError(operationId, error);
        return null;
      }
    },
    [setOperationLoading, setOperationData, setOperationError]
  );

  const getOperation = useCallback(
    (operationId: string) => {
      return operations[operationId] || { isLoading: false, error: null, data: null };
    },
    [operations]
  );

  const clearOperation = useCallback((operationId: string) => {
    setOperations(prev => {
      const newOps = { ...prev };
      delete newOps[operationId];
      return newOps;
    });
  }, []);

  return {
    operations,
    executeOperation,
    getOperation,
    clearOperation,
  };
}

export default useErrorHandling;
