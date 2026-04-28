/**
 * GraphQL Subscriptions Configuration
 * Provides WebSocket-based real-time data updates using Apollo Client and graphql-ws
 */

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient as createWSClient } from 'graphql-ws';
import { ApolloClient, InMemoryCache, ApolloLink, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { DocumentNode } from 'graphql';

/**
 * WebSocket subscription configuration options
 */
export interface SubscriptionConfig {
  /** GraphQL subscriptions endpoint URL */
  subscriptionUrl: string;
  /** GraphQL HTTP endpoint URL (for queries/mutations) */
  httpUrl: string;
  /** WebSocket reconnection options */
  reconnect?: {
    /** Maximum number of reconnection attempts */
    maxRetries?: number;
    /** Initial delay in milliseconds */
    initialDelayMs?: number;
    /** Maximum delay in milliseconds */
    maxDelayMs?: number;
  };
  /** Custom headers for authentication */
  headers?: Record<string, string>;
  /** Connection timeout in milliseconds */
  connectionTimeoutMs?: number;
}

/**
 * Default subscription configuration
 */
export const DEFAULT_SUBSCRIPTION_CONFIG: Partial<SubscriptionConfig> = {
  reconnect: {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
  connectionTimeoutMs: 5000,
};

/**
 * Connection state enum
 */
export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING',
}

/**
 * Subscription connection lifecycle event
 */
export interface ConnectionEvent {
  state: ConnectionState;
  error?: Error | null;
  timestamp: Date;
}

/**
 * Global connection state management
 */
class SubscriptionConnectionManager {
  private static instance: SubscriptionConnectionManager;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners: Set<(event: ConnectionEvent) => void> = new Set();
  private retryCount: number = 0;
  private retryTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SubscriptionConnectionManager {
    if (!SubscriptionConnectionManager.instance) {
      SubscriptionConnectionManager.instance = new SubscriptionConnectionManager();
    }
    return SubscriptionConnectionManager.instance;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Set connection state and notify listeners
   */
  setState(newState: ConnectionState, error?: Error | null): void {
    if (this.state === newState && !error) return;

    this.state = newState;

    const event: ConnectionEvent = {
      state: newState,
      error,
      timestamp: new Date(),
    };

    this.notifyListeners(event);
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(listener: (event: ConnectionEvent) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(event: ConnectionEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error notifying subscription listener:', err);
      }
    });
  }

  /**
   * Reset retry count
   */
  resetRetryCount(): void {
    this.retryCount = 0;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  /**
   * Increment retry count
   */
  incrementRetryCount(config: SubscriptionConfig): number {
    this.retryCount++;
    return this.retryCount;
  }

  /**
   * Get current retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }
}

/**
 * Calculate exponential backoff delay for reconnection
 */
function calculateBackoffDelay(
  retryCount: number,
  config: SubscriptionConfig,
): number {
  const { reconnect } = { ...DEFAULT_SUBSCRIPTION_CONFIG, ...config };
  if (!reconnect) return 0;

  const { initialDelayMs = 1000, maxDelayMs = 30000 } = reconnect;
  const exponentialDelay = initialDelayMs * Math.pow(2, retryCount - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);

  return Math.min(jitteredDelay, maxDelayMs);
}

/**
 * Creates a GraphQL subscriptions-enabled Apollo Client
 */
export function createSubscriptionClient(config: SubscriptionConfig): ApolloClient<any> {
  const manager = SubscriptionConnectionManager.getInstance();

  // Create WebSocket client for subscriptions
  const wsClient = createWSClient({
    url: config.subscriptionUrl,
    connectionParams: () => ({
      authorization: config.headers?.authorization ?? '',
    }),
    shouldRetry: (code) => {
      // Retry on transient errors
      return code !== 1000 && code !== 1001 && code !== 4000; // 4000 is auth error
    },
    retryAttempts: config.reconnect?.maxRetries ?? 5,
    on: {
      connected: () => {
        manager.setState(ConnectionState.CONNECTED);
        manager.resetRetryCount();
      },
      error: (error) => {
        manager.setState(ConnectionState.ERROR, error);
      },
      closed: () => {
        manager.setState(ConnectionState.DISCONNECTED);
      },
      connecting: () => {
        manager.setState(ConnectionState.CONNECTING);
      },
    },
    // Add connection timeout
    connectionAckWaitTimeout: config.connectionTimeoutMs ?? 5000,
  });

  // Create WebSocket link
  const wsLink = new GraphQLWsLink(wsClient);

  // Create HTTP link for queries and mutations
  const httpLink = new HttpLink({
    uri: config.httpUrl,
    credentials: 'include',
    headers: config.headers,
  });

  // Split traffic: subscriptions via WebSocket, queries/mutations via HTTP
  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink,
  );

  // Create Apollo Client
  const client = new ApolloClient({
    link: ApolloLink.from([splitLink]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // Add custom cache policies here
          },
        },
      },
    }),
  });

  return client;
}

/**
 * Get the current connection manager singleton
 */
export function getConnectionManager(): SubscriptionConnectionManager {
  return SubscriptionConnectionManager.getInstance();
}

/**
 * Check if a GraphQL document is a subscription
 */
export function isSubscription(document: DocumentNode): boolean {
  const definition = getMainDefinition(document);
  return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
}

/**
 * Subscription error handler
 */
export class SubscriptionError extends Error {
  constructor(
    public code: string,
    public details?: Record<string, any>,
  ) {
    super(`Subscription error: ${code}`);
    this.name = 'SubscriptionError';
  }
}

/**
 * Check is connection error
 */
export function isConnectionError(error: any): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('WebSocket') || error.message.includes('connection'))
  );
}

/**
 * Format error message for UI
 */
export function formatSubscriptionError(error: any): string {
  if (error instanceof SubscriptionError) {
    return `Real-time error: ${error.code}`;
  }

  if (isConnectionError(error)) {
    return 'Connection lost. Reconnecting...';
  }

  return 'Real-time update failed. Please refresh.';
}
