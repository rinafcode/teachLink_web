'use client';

/**
 * useMutation
 *
 * Lightweight hook for async write operations (POST / PUT / DELETE).
 * Key properties:
 *  - Tracks isLoading / isSuccess / isError / data / error state.
 *  - Prevents double-submission via an in-flight ref guard; concurrent calls
 *    while a mutation is already running are silently dropped.
 *  - `mutate`       – fire-and-forget; surfaces errors only via state.
 *  - `mutateAsync`  – returns a Promise so callers can await/catch manually.
 *  - `reset`        – returns state to idle without cancelling in-flight work.
 */

import { useState, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MutationState<TData> {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  data: TData | null;
  error: Error | null;
}

export interface MutationOptions<TData, TVariables> {
  /** Called after a successful mutation with the returned data and variables. */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Called when the mutation throws, before the error is stored in state. */
  onError?: (error: Error, variables: TVariables) => void | Promise<void>;
  /** Called after the mutation settles (success *or* error). */
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
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

// ─── Initial state ────────────────────────────────────────────────────────────

const IDLE_STATE = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: null,
  error: null,
} as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @template TData     The type returned by the mutation function.
 * @template TVariables The argument type accepted by the mutation function.
 *                      Defaults to `void` for zero-argument mutations.
 */
export function useMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOptions<TData, TVariables> = {},
): MutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [state, setState] = useState<MutationState<TData>>(IDLE_STATE);

  /** Guards against concurrent calls: once true, new invocations are no-ops. */
  const inFlightRef = useRef(false);

  // Keep option callbacks in refs so they can be updated without re-creating
  // `mutateAsync` (avoids stale-closure bugs without listing callbacks as deps).
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSettledRef = useRef(onSettled);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  onSettledRef.current = onSettled;

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      // ── Double-submission guard ──────────────────────────────────────────
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
    [mutationFn],
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
