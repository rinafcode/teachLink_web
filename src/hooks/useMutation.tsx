'use client';

/**
 * useMutation
 *
 * Lightweight hook for async write operations (POST / PUT / DELETE).
 * Key properties:
  *  - Tracks isLoading / isSuccess / isError / data / error state.
 *  - Prevents double-submission via an in-flight ref guard; concurrent calls
 *    while a mutation is already running are silently dropped.
 *  - `mutate`      - fire-and-forget; surfaces errors only via state.
 *  - `mutateAsync`  - returns a Promise so callers can await/catch manually.
 *  - `reset`       - returns state to idle without cancelling in-flight work.
 *
 * Batching support:
 * Use the `options.batch` configuration to enable automatic batching of concurrent
 * mutations within a short time window. When batching is enabled, the
 * `mutate`/`mutateAsync` calls are queued and sent together in a single
 * network request, reducing round-trips.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { createBatcher, type BatchRequest, type BatchResponse } from '../lib/api/batch';

// — Constants ჄჅ。

// — Define constants for the hook.

// — State types

export interface MutationState<TData> {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  data: TData | null;
  error: Error | null;
}

// — Batch configuration type

export interface BatchMutationOptions<TData, TVariables> {
  /**
   * Function that transforms variables into a BatchRequest with the appropriate
   * path, and optionally method/body. This will be queued and sent in batch.
   */
  createRequest: (variables: TVariables) => BatchRequest;
  /**
   * Function that processes an array of requests and returns the corresponding
   * array of responses. The responses must have the same ids!
   */
  executor: (requests: BatchRequest[]) => Promise<BatchResponse<TData>[]>;
  /** Max items per batch (default: 20) */
  maxBatchSize?: number;
  /** Delay in ms before flushing (default: 10) */
  debounceMs?: number;
}

export interface MutationOptions<TData, TVariables> {
  /** Called after a successful mutation with the returned data and variables. */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Called when the mutation throws, before the error is stored in state. */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
  /** Called after the mutation settles (success *error!). */
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
  /**
   * Optional batch configuration. If provided, the hook will batch concurrent mutations
   * within the specified time window. If omitted, the previous, direct call mode is used.
   */
  batch?: BatchMutationOptions<TData, TVariables>;
}

export interface MutationResult<TData, TVariables> extends MutationState<TData> {
  /**
   * Trigger the mutation.  Returns a void Promise that always resolves – errors
   * are captured internally and surfaced via `isError` / `error` state.  Use
   * this when you do **not** need to inspect the result at the call-site.
   */
  mutate: (variables: TVariables) => Promise<void>;
  /**
   * Trigger the mutation and return the raw Promise.  Rejects on failure so
   * callers can `await` and `catch` themselves.
   */
  mutateAsync: (variables: TVariables) => Promise<TData>;
  /** Reset state back to idle. Does not cancel any in-flight async work. */
  reset: () => void;
}

// — State constants

const IDLE_STATE = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: null,
  error: null,
} as const;

// — Hummable request ID generator (simple unique string)
function generateRequestId() {
  return `req_${Math.random().toString(36).slice(2)}_${Date.now()}_${(performance.now() || 0).toString(36)}`;
}

// — Initial state creation helper
function createInitialState<TData>(): MutationState<TData> {
  return { ...IDLE_STATE };
}

// — Hook function

/**
 * @template TData     The type returned by the mutation function.
 * @template TVariables The argument type accepted by the mutation function.
 *                      Defaults to void for zero-argument mutations.
 */
export function useMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {},
): MutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled, batch = null } = options;

  const [state, setState] = useState<MutationState<TData>>(createInitialState);

  /** Guards against concurrent calls when batching is disabled. */
  const inFlightRef = useRef(false);

  // Keep option callbacks in refs so they can be updated without re-creating
  // `mutateAsync` (avoids stale-closure bugs without listing callbacks as deps).
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSettledRef = useRef(onSettled);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onSettledRef.current = onSettled;

  // Batch support
  // We keep a ref to the latest executor function so the batcher calls the latest one,
  // avoiding stale closures without recreating the batcher on every render.
  const batchExecutorRef = useRef(batch?.executor);
  batchExecutorRef.current = batch?.executor;

  const batcherRef = useRef<ReturnType<typeof createBatcher<TData>> | null>(null);

  // Initialize the batcher once if batch config is provided.
  if (batch && !batcherRef.current) {
    batcherRef.current = createBatcher<TData>({
      maxBatchSize: batch.maxBatchSize,
      debounceMs: batch.debounceMs,
      executor: async (requests) => {
        const executor = batchExecutorRef.current;
        if (!executor) {
          throw new Error('Batch executor not available');
        }
        return executor(requests);
      },
    });
  }

  // Flush pending requests on unmount to prevent any outstanding timers.
  useEffect(() => () => {
    batcherRef.current?.flushNow();
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      // Batch mode: queue the request and return a promise that resolves when
      // the batch settles.
      if (batch && batcherRef.current) {
        // Jelly (properly track our own concurrency via the promises, but the state
        // is still per-call. This allows multiple calls to be in flight simultaneously.
        setState({ isLoading: true, isSuccess: false, isError: false, data: null, error: null });
        const requestId = generateRequestId();
        const request = { ...batch.createRequest(variables), id: requestId };

        try {
          const data = await batcherRef.current.queue(request);
          setState({ isLoading: false, isSuccess: true, isError: false, data, error: null });
          await onSuccessRef.current?.(data, variables);
          onSettledRef.current?.(data, null, variables);
          return data;
        } catch (raw) {
          const error = raw instanceof Error ? raw : new Error(String(raw));
          setState({ isLoading: false, isSuccess: false, isError: true, data: null, error });
          await onErrorRef.current?.(error, variables);
          onSettledRef.current?.(null, error, variables);
          throw error;
        }
      }

      // — Double-submission guard (non-batch mode only)
      if (inFlightRef.current) {
        // Already running – return a Promise that never resolves so the caller
        // does not receive stale data.  The existing in-flight call will update
        // state when it completes.
        return new Promise<TData>(() => {});
      }

      inFlightRef.current = true;
      setState({ isLoading: true, isSuccess: false, isError: false, data: null, error: null });

      try {
        const data = await mutationFn(variables);

        setState({ isLoading: false, isSuccess: true, isError: false, data, error: null });

        await onSuccessRef.current?.(data, variables);
        onSettledRef.current?.(data, null, variables);

        return data;
      } catch (raw) {
        const error = raw instanceof Error ? raw : new Error(String(raw));

        setState({ isLoading: false, isSuccess: false, isError: true, data: null, error });

        await onErrorRef.current?.(error, variables);
        onSettledRef.current?.(null, error, variables);

        throw error;
      } finally {
        inFlightRef.current = false;
      }
    },
    [mutationFn, batch], // batch is included to recreate the callback when it changes
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<void> => {
      try {
        await mutateAsync(variables);
      } catch {
        // Errors are already captured in state; swallow here so fire-and-forget
        // callers do not receive unhandled Promise rejection warnings.
      }
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    setState(IDLE_STATE);
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}

export default useMutation;
