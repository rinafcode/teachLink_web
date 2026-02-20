'use client';

/**
 * Error Recovery Mechanism Component
 * Handles automatic retry and recovery for failed operations
 */

import React, { useState, useCallback, useRef } from 'react';
import { retryWithBackoff, isRetryable, getUserFriendlyMessage } from '@/utils/errorUtils';
import { errorReportingService } from '@/services/errorReporting';

export interface RecoveryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  onFailure?: (error: any) => void;
}

export interface RecoveryState {
  isRecovering: boolean;
  attempts: number;
  maxAttempts: number;
  lastError?: any;
  canRetry: boolean;
}

class ErrorRecoveryMechanism {
  private recoveryQueue: Array<{
    id: string;
    fn: () => Promise<any>;
    options: RecoveryOptions;
    state: RecoveryState;
  }> = [];

  /**
   * Execute function with automatic recovery
   */
  async execute<T>(
    id: string,
    fn: () => Promise<T>,
    options: RecoveryOptions = {}
  ): Promise<T> {
    const state: RecoveryState = {
      isRecovering: true,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      canRetry: true,
    };

    const recovery = { id, fn, options, state };
    this.recoveryQueue.push(recovery);

    try {
      return await retryWithBackoff(
        async () => {
          state.attempts++;
          options.onRetry?.(state.attempts);
          return fn();
        },
        {
          maxAttempts: options.maxAttempts || 3,
          initialDelayMs: options.initialDelayMs || 1000,
          maxDelayMs: options.maxDelayMs || 30000,
          backoffFactor: options.backoffFactor || 2,
        }
      );
    } catch (error) {
      state.lastError = error;
      state.canRetry = false;
      state.isRecovering = false;

      options.onFailure?.(error);

      await errorReportingService.reportError(error, {
        recoveryId: id,
        attempts: state.attempts,
        maxAttempts: state.maxAttempts,
      });

      throw error;
    } finally {
      state.isRecovering = false;
      options.onSuccess?.();
      this.removeRecovery(id);
    }
  }

  /**
   * Retry a failed recovery
   */
  async retryRecovery(id: string): Promise<any> {
    const recovery = this.recoveryQueue.find(r => r.id === id);
    if (!recovery) throw new Error(`Recovery with id ${id} not found`);

    return this.execute(id, recovery.fn, recovery.options);
  }

  /**
   * Cancel recovery
   */
  cancelRecovery(id: string): void {
    this.removeRecovery(id);
  }

  /**
   * Get recovery state
   */
  getRecoveryState(id: string): RecoveryState | undefined {
    return this.recoveryQueue.find(r => r.id === id)?.state;
  }

  /**
   * Remove recovery from queue
   */
  private removeRecovery(id: string): void {
    this.recoveryQueue = this.recoveryQueue.filter(r => r.id !== id);
  }

  /**
   * Clear all recoveries
   */
  clearAll(): void {
    this.recoveryQueue = [];
  }

  /**
   * Get all active recoveries
   */
  getActiveRecoveries(): Array<{
    id: string;
    state: RecoveryState;
  }> {
    return this.recoveryQueue.map(r => ({
      id: r.id,
      state: r.state,
    }));
  }
}

// Export singleton
export const errorRecoveryMechanism = new ErrorRecoveryMechanism();

/**
 * React Hook for Error Recovery
 */
export function useErrorRecovery(id: string) {
  const [state, setState] = useState<RecoveryState>({
    isRecovering: false,
    attempts: 0,
    maxAttempts: 3,
    canRetry: true,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const execute = useCallback(
    async <T,>(fn: () => Promise<T>, options: RecoveryOptions = {}): Promise<T> => {
      setState((prev: RecoveryState) => ({
        ...prev,
        isRecovering: true,
        attempts: 0,
        canRetry: true,
      }));

      try {
        const result = await errorRecoveryMechanism.execute(id, fn, {
          ...options,
          onRetry: (attempt: number) => {
            setState((prev: RecoveryState) => ({
              ...prev,
              attempts: attempt,
            }));
            options.onRetry?.(attempt);
          },
          onFailure: (error: any) => {
            setState((prev: RecoveryState) => ({
              ...prev,
              lastError: error,
              canRetry: isRetryable(error),
              isRecovering: false,
            }));
            options.onFailure?.(error);
          },
          onSuccess: () => {
            setState((prev: RecoveryState) => ({
              ...prev,
              isRecovering: false,
            }));
            options.onSuccess?.();
          },
        });

        return result;
      } catch (error) {
        throw error;
      }
    },
    [id]
  );

  const retry = useCallback(async () => {
    setState((prev: RecoveryState) => ({
      ...prev,
      isRecovering: true,
      attempts: 0,
    }));

    try {
      await errorRecoveryMechanism.retryRecovery(id);
      setState((prev: RecoveryState) => ({
        ...prev,
        isRecovering: false,
      }));
    } catch (error) {
      setState((prev: RecoveryState) => ({
        ...prev,
        lastError: error,
        isRecovering: false,
      }));
    }
  }, [id]);

  const cancel = useCallback(() => {
    errorRecoveryMechanism.cancelRecovery(id);
    setState((prev: RecoveryState) => ({
      ...prev,
      isRecovering: false,
    }));
  }, [id]);

  return {
    ...state,
    execute,
    retry,
    cancel,
  };
}

export default ErrorRecoveryMechanism;
