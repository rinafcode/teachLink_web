'use client';

import { useEffect, useRef, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { ApolloClient, DocumentNode, ApolloError, OperationVariables, ObservableSubscription } from '@apollo/client';
import {
  ConnectionState,
  getConnectionManager,
  isConnectionError,
  formatSubscriptionError,
  ConnectionEvent,
} from '@/lib/graphql/subscriptions';
import { createLogger } from '@/lib/logging';

/**
 * Deep equality comparison for variables to prevent unnecessary re-subscriptions
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  
  return true;
}

const logger = createLogger('use-subscription');

export { ConnectionState, getConnectionManager, isConnectionError, formatSubscriptionError };

/**
 * Subscription variable constraints
 */
export interface UseSubscriptionOptions<TData = unknown> {
  /** Skip subscription execution */
  skip?: boolean;
  /** Callback when subscription connects */
  onConnect?: () => void;
  /** Callback when subscription disconnects */
  onDisconnect?: () => void;
  /** Callback when subscription error occurs */
  onError?: (error: ApolloError | SubscriptionError) => void;
  /** Callback when data updates */
  onData?: (data: TData) => void;
  /** Retry failed subscriptions */
  shouldResubscribe?: boolean;
  /** Cache policy for subscription data */
  cachePolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'no-cache';
}

/**
 * Result of a subscription hook
 */
export interface UseSubscriptionResult<TData> {
  /** Current subscription data */
  data: TData | undefined;
  /** Loading state (true initially or during reconnection) */
  loading: boolean;
  /** Current error if any */
  error: ApolloError | SubscriptionError | null;
  /** Current connection state */
  connectionState: ConnectionState;
  /** Error message formatted for UI */
  errorMessage: string | null;
  /** Resubscribe to the subscription */
  resubscribe: () => void;
  /** Manually update data */
  updateData: Dispatch<SetStateAction<TData | undefined>>;
}

/**
 * Custom error for subscription-specific issues
 */
export class SubscriptionError extends Error {
  constructor(
    public reason: 'connection' | 'subscription' | 'timeout' | 'unknown',
    message: string,
  ) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

/**
 * Hook for managing GraphQL subscriptions
 * Handles connection lifecycle, reconnection, and error recovery
 *
 * @example
 * ```tsx
 * const { data, loading, error, connectionState } = useSubscription(
 *   POSTS_SUBSCRIPTION,
 *   {
 *     variables: { limit: 10 },
 *     onData: (data) => console.log('New post:', data),
 *   },
 *   apolloClient,
 * );
 * ```
 */
export function useSubscription<TData = unknown, TVariables extends OperationVariables = OperationVariables>(
  subscription: DocumentNode,
  options: UseSubscriptionOptions<TData> & { variables?: TVariables } = {},
  client?: ApolloClient<unknown>,
): UseSubscriptionResult<TData> {
  const {
    skip = false,
    shouldResubscribe = true,
  } = options;

  // Stabilize callbacks using refs to prevent unnecessary re-subscriptions
  const onConnectRef = useRef(options.onConnect);
  const onDisconnectRef = useRef(options.onDisconnect);
  const onErrorRef = useRef(options.onError);
  const onDataRef = useRef(options.onData);
  
  // Update refs when callbacks change
  useEffect(() => {
    onConnectRef.current = options.onConnect;
  }, [options.onConnect]);
  
  useEffect(() => {
    onDisconnectRef.current = options.onDisconnect;
  }, [options.onDisconnect]);
  
  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);
  
  useEffect(() => {
    onDataRef.current = options.onData;
  }, [options.onData]);

  // Stabilize variables using ref and deep comparison
  const variablesRef = useRef(options.variables);
  const [variablesChanged, setVariablesChanged] = useState(false);
  
  useEffect(() => {
    if (!deepEqual(variablesRef.current, options.variables)) {
      variablesRef.current = options.variables;
      setVariablesChanged(prev => !prev);
    }
  }, [options.variables]);

  const [data, setData] = useState<TData | undefined>();
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<ApolloError | SubscriptionError | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );
  const subscriptionRef = useRef<ObservableSubscription | { subscribe: (observer: { next?: (res: { data?: TData }) => void; error?: (err: unknown) => void; complete?: () => void }) => { unsubscribe?: () => void } | (() => void) } | null>(null);
  const unsubscribeRef = useRef<(() => void) | { unsubscribe?: () => void } | null>(null);
  const connectionListenerRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);

  const handleConnectionStateChange = useCallback(
    (event: ConnectionEvent) => {
      setConnectionState(event.state);

      if (event.state === ConnectionState.CONNECTED) {
        onConnectRef.current?.();
      } else if (event.state === ConnectionState.DISCONNECTED) {
        onDisconnectRef.current?.();
      }
    },
    [], // No dependencies since we use refs
  );

  /**
   * Execute the subscription
   */
  const executeSubscription = useCallback(async () => {
    if (!client || skip) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      subscriptionRef.current = client.subscribe({
        query: subscription,
        variables: variablesRef.current,
      }) as unknown as typeof subscriptionRef.current;

      if (subscriptionRef.current) {
        unsubscribeRef.current = subscriptionRef.current.subscribe({
          next: (response: { data?: TData }) => {
            attemptCountRef.current = 0; // Reset on successful data
            setLoading(false);

            // Extract data from response
            const resultData = response.data;
            setData(resultData);
            if (resultData !== undefined) {
              onDataRef.current?.(resultData);
            }
          },
          error: (err: unknown) => {
            setLoading(false);

            const errMessage = err instanceof Error ? err.message : String(err);
            const apolloError =
              err instanceof ApolloError ? err : new ApolloError({ errorMessage: errMessage });
            setError(apolloError);

            if (isConnectionError(err)) {
              setConnectionState(ConnectionState.ERROR);
              if (shouldResubscribe && attemptCountRef.current < 3) {
                attemptCountRef.current++;
                // Exponential backoff for reconnection
                const delay = Math.min(1000 * Math.pow(2, attemptCountRef.current), 10000);
                reconnectTimeoutRef.current = setTimeout(() => {
                  executeSubscription();
                }, delay);
              }
            }

            onErrorRef.current?.(apolloError);
          },
          complete: () => {
            setLoading(false);
            // Handle completion if needed
          },
        });
      }
    } catch (err) {
      const wrappedError =
        err instanceof ApolloError
          ? err
          : new SubscriptionError('unknown', err instanceof Error ? err.message : 'Unknown error');

      setError(wrappedError);
      setLoading(false);
      onErrorRef.current?.(wrappedError);
    }
  }, [client, skip, subscription, shouldResubscribe]); // Remove unstable dependencies

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      if (typeof unsubscribeRef.current === 'function') {
        unsubscribeRef.current();
      } else if (typeof unsubscribeRef.current === 'object' && typeof unsubscribeRef.current.unsubscribe === 'function') {
        unsubscribeRef.current.unsubscribe();
      }
      unsubscribeRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionListenerRef.current) {
      connectionListenerRef.current();
      connectionListenerRef.current = null;
    }
  }, []);

  /**
   * Setup subscription on mount and when dependencies change
   */
  useEffect(() => {
    const manager = getConnectionManager();

    // Listen to connection state changes
    connectionListenerRef.current = manager.onStateChange(handleConnectionStateChange);

    // Set initial connection state
    setConnectionState(manager.getState());

    // Execute subscription if not skipped
    if (!skip && client) {
      executeSubscription();
    }

    // Cleanup on unmount or when dependencies change
    return cleanup;
  }, [client, skip, executeSubscription, cleanup, handleConnectionStateChange]);

  // Re-execute subscription when variables change
  useEffect(() => {
    if (!skip && client && variablesChanged) {
      cleanup();
      executeSubscription();
    }
  }, [variablesChanged, client, skip, cleanup, executeSubscription]);

  /**
   * Resubscribe to the subscription
   */
  const resubscribe = useCallback(() => {
    cleanup();
    attemptCountRef.current = 0;
    executeSubscription();
  }, [cleanup, executeSubscription]);

  /**
   * Format error message
   */
  const errorMessage =
    error instanceof ApolloError
      ? error.message || 'Subscription error'
      : error instanceof SubscriptionError
      ? formatSubscriptionError(error)
      : error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message)
      : null;

  return {
    data,
    loading,
    error,
    connectionState,
    errorMessage,
    resubscribe,
    updateData: setData,
  };
}

/**
 * Hook for listening to connection state changes without data subscription
 * Useful for implementing real-time status indicators
 *
 * @example
 * ```tsx
 * const state = useSubscriptionConnection();
 * return <StatusIndicator state={state} />;
 * ```
 */
export function useSubscriptionConnection(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);

  useEffect(() => {
    const manager = getConnectionManager();
    setState(manager.getState());

    const unsubscribe = manager.onStateChange((event) => {
      setState(event.state);
    });

    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook for managing multiple subscriptions with fallback to polling
 */
export interface UsePollableSubscriptionOptions<T> extends UseSubscriptionOptions<T> {
  /** Polling interval in milliseconds (fallback when subscription unavailable) */
  pollIntervalMs?: number;
  /** Fallback fetch function for polling */
  pollFn?: () => Promise<T>;
}

export function usePollableSubscription<TData = unknown, TVariables extends OperationVariables = OperationVariables>(
  subscription: DocumentNode,
  options: UsePollableSubscriptionOptions<TData> & { variables?: TVariables } = {},
  client?: ApolloClient<unknown>,
): UseSubscriptionResult<TData> {
  const { pollIntervalMs = 5000, pollFn } = options;
  const [isPolling, setIsPolling] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionResult = useSubscription<TData, TVariables>(subscription, options, client);
  const { connectionState, updateData } = subscriptionResult;

  /**
   * Fallback to polling when subscription unavailable
   */
  useEffect(() => {
    // If subscription is working, don't poll
    if (connectionState === ConnectionState.CONNECTED) {
      setIsPolling(false);
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      return;
    }

    // Start polling if connection is down and poll function available
    if (
      pollFn &&
      (connectionState === ConnectionState.DISCONNECTED ||
        connectionState === ConnectionState.ERROR)
    ) {
      setIsPolling(true);

      const poll = async () => {
        try {
          const data = await pollFn();
          updateData(data);
        } catch (err) {
          logger.error('Poll failed', { error: err });
        }

        pollTimeoutRef.current = setTimeout(poll, pollIntervalMs);
      };

      // Start first poll after delay
      poll();
    }

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [pollFn, pollIntervalMs, connectionState, updateData]);

  return {
    ...subscriptionResult,
    loading: subscriptionResult.loading || isPolling,
  };
}
