'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  DependencyList,
  Dispatch,
  SetStateAction,
} from 'react';
import { ApolloClient, DocumentNode, ApolloError, OperationVariables, gql } from '@apollo/client';
import {
  ConnectionState,
  getConnectionManager,
  isConnectionError,
  formatSubscriptionError,
} from '@/lib/graphql/subscriptions';

/**
 * Subscription variable constraints
 */
export interface UseSubscriptionOptions {
  /** Skip subscription execution */
  skip?: boolean;
  /** Callback when subscription connects */
  onConnect?: () => void;
  /** Callback when subscription disconnects */
  onDisconnect?: () => void;
  /** Callback when subscription error occurs */
  onError?: (error: ApolloError) => void;
  /** Callback when data updates */
  onData?: (data: any) => void;
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
export function useSubscription<TData = any, TVariables extends OperationVariables = any>(
  subscription: DocumentNode,
  options: UseSubscriptionOptions & { variables?: TVariables } = {},
  client?: ApolloClient<any>,
): UseSubscriptionResult<TData> {
  const { skip = false, onConnect, onDisconnect, onError, onData, shouldResubscribe = true } =
    options;

  const [data, setData] = useState<TData | undefined>();
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<ApolloError | SubscriptionError | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );
  const subscriptionRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const connectionListenerRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);

  const handleConnectionStateChange = useCallback(
    (event: any) => {
      setConnectionState(event.state);

      if (event.state === ConnectionState.CONNECTED) {
        onConnect?.();
      } else if (event.state === ConnectionState.DISCONNECTED) {
        onDisconnect?.();
      }
    },
    [onConnect, onDisconnect],
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
        variables: options.variables,
      });

      unsubscribeRef.current = subscriptionRef.current.subscribe({
        next: (response: any) => {
          attemptCountRef.current = 0; // Reset on successful data
          setLoading(false);

          // Extract data from response
          const resultData = response.data;
          setData(resultData);
          onData?.(resultData);
        },
        error: (err: any) => {
          setLoading(false);

          const apolloError = err instanceof ApolloError ? err : new ApolloError({ errorMessage: err.message });
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

          onError?.(apolloError);
        },
        complete: () => {
          setLoading(false);
          // Handle completion if needed
        },
      });
    } catch (err) {
      const wrappedError =
        err instanceof ApolloError
          ? err
          : new SubscriptionError('unknown', err instanceof Error ? err.message : 'Unknown error');

      setError(wrappedError);
      setLoading(false);
      onError?.(wrappedError as any);
    }
  }, [client, skip, subscription, options.variables, onData, onError, shouldResubscribe]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
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
        : error?.message || null;

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
export interface UsePollableSubscriptionOptions<T> extends UseSubscriptionOptions {
  /** Polling interval in milliseconds (fallback when subscription unavailable) */
  pollIntervalMs?: number;
  /** Fallback fetch function for polling */
  pollFn?: () => Promise<T>;
}

export function usePollableSubscription<TData = any, TVariables extends OperationVariables = any>(
  subscription: DocumentNode,
  options: UsePollableSubscriptionOptions<TData> & { variables?: TVariables } = {},
  client?: ApolloClient<any>,
): UseSubscriptionResult<TData> {
  const { pollIntervalMs = 5000, pollFn } = options;
  const [isPolling, setIsPolling] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionResult = useSubscription<TData, TVariables>(subscription, options, client);

  /**
   * Fallback to polling when subscription unavailable
   */
  useEffect(() => {
    // If subscription is working, don't poll
    if (subscriptionResult.connectionState === ConnectionState.CONNECTED) {
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
      (subscriptionResult.connectionState === ConnectionState.DISCONNECTED ||
        subscriptionResult.connectionState === ConnectionState.ERROR)
    ) {
      setIsPolling(true);

      const poll = async () => {
        try {
          const data = await pollFn();
          subscriptionResult.updateData(data);
        } catch (err) {
          console.error('Poll failed:', err);
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
  }, [pollFn, pollIntervalMs, subscriptionResult.connectionState, subscriptionResult.updateData]);

  return {
    ...subscriptionResult,
    loading: subscriptionResult.loading || isPolling,
  };
}
