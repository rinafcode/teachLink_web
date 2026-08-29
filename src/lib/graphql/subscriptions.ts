/**
 * GraphQL Subscriptions Configuration
 * Provides WebSocket-based real-time data updates using Apollo Client and graphql-ws
 *
 * The graphql-ws socket lifecycle (reconnect, heartbeat, queueing) is delegated to
 * the shared `ConnectionSupervisor` (src/lib/realtime/connectionSupervisor.ts):
 * graphql-ws only opens the socket lazily, the supervisor schedules reconnects and
 * the transport re-subscribes every registered subscription after a reconnect.
 */

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient as createWSClient, type Client } from 'graphql-ws';
import { ApolloClient, InMemoryCache, ApolloLink, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { DocumentNode, print } from 'graphql';
import { flagStore, evaluateFlag } from '@/lib/feature-flags';
import { createLogger } from '@/lib/logging';
import {
  BaseRealtimeTransport,
  ConnectionSupervisor,
  getSupervisor,
  registerSupervisor,
} from '@/lib/realtime/connectionSupervisor';

const logger = createLogger('graphql-subscriptions');

/** Name under which the GraphQL subscription supervisor is registered. */
export const GRAPHQL_SUBSCRIPTIONS_CONNECTION = 'graphql-subscriptions';

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
  /**
   * Feature flag gate for this client.
   * When provided, the WebSocket link is only created if the flag is enabled
   * for the given user context. Queries/mutations always fall through to HTTP.
   *
   * @example { flagId: 'flag_realtime_subscriptions', context: { userId, plan } }
   */
  featureGate?: {
    flagId: string;
    context?: Record<string, string>;
  };
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
        logger.error('Error notifying subscription listener', { error: err });
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
function calculateBackoffDelay(retryCount: number, config: SubscriptionConfig): number {
  const { reconnect } = { ...DEFAULT_SUBSCRIPTION_CONFIG, ...config };
  if (!reconnect) return 0;

  const { initialDelayMs = 1000, maxDelayMs = 30000 } = reconnect;
  const exponentialDelay = initialDelayMs * Math.pow(2, retryCount - 1);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);

  return Math.min(jitteredDelay, maxDelayMs);
}

/**
 * Evaluate a feature gate against the in-process flag store.
 * Returns true when no gate is configured (opt-in, non-breaking).
 */
export function isFeatureEnabled(flagId: string, context: Record<string, string> = {}): boolean {
  const flag = flagStore.get(flagId);
  if (!flag) return false;
  return evaluateFlag(flag, context);
}

interface SubscriptionEntry {
  query: DocumentNode;
  variables?: Record<string, unknown>;
  handler: (payload: any) => void;
}

/**
 * graphql-ws transport adapter. The socket opens lazily (only when there is at
 * least one active subscription); the ConnectionSupervisor drives reconnects and
 * this adapter re-subscribes every registered entry after each reconnect.
 */
class GraphQLWsTransport extends BaseRealtimeTransport {
  readonly name = 'graphql';
  private client: Client | null = null;
  private connected = false;
  private readonly subscriptions = new Map<string, SubscriptionEntry>();
  private readonly unsubscribes = new Map<string, () => void>();
  private resubscribeInProgress = false;

  constructor(private readonly config: SubscriptionConfig) {
    super();
  }

  getClient(): Client | null {
    return this.client;
  }

  /**
   * Get the count of active subscriptions
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  connect(): void {
    if (this.client && this.connected) {
      logger.debug('[GraphQLWsTransport] Already connected, skipping reconnect');
      return;
    }

    if (this.client && !this.connected) {
      logger.debug('[GraphQLWsTransport] Terminating stale client connection');
      this.client.terminate();
      this.client = null;
    }

    if (!this.client) {
      logger.debug('[GraphQLWsTransport] Creating new WebSocket client', {
        url: this.config.subscriptionUrl,
      });
      const { reconnect } = { ...DEFAULT_SUBSCRIPTION_CONFIG, ...this.config };
      this.client = createWSClient({
        url: this.config.subscriptionUrl,
        connectionParams: () => ({
          authorization: this.config.headers?.authorization ?? '',
        }),
        // Reconnection is owned by the ConnectionSupervisor.
        shouldRetry: () => false,
        retryAttempts: 0,
        lazy: true,
        keepAlive: 10_000,
        on: {
          connected: () => {
            this.connected = true;
            logger.debug('[GraphQLWsTransport] WebSocket connected');
            this.events.emitOpen();
          },
          error: (error) => {
            logger.error('[GraphQLWsTransport] WebSocket error', { error });
            this.events.emitError(error);
          },
          closed: () => {
            logger.debug('[GraphQLWsTransport] WebSocket closed');
            this.connected = false;
            this.client?.terminate();
            this.client = null;
            this.events.emitClose();
          },
          connecting: () => {
            logger.debug('[GraphQLWsTransport] WebSocket connecting');
            // Status is driven by the supervisor's own 'connecting' phase.
          },
        },
        connectionAckWaitTimeout: this.config.connectionTimeoutMs ?? 5000,
      });
    }
    // Restore every subscription — opening the socket lazily if needed.
    this.resubscribeAll();
  }

  disconnect(): void {
    this.close();
  }

  close(): void {
    this.connected = false;
    this.unsubscribes.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        logger.warn('[GraphQLWsTransport] Error unsubscribing during close', { error });
      }
    });
    this.unsubscribes.clear();
    this.client?.terminate();
    this.client = null;
  }

  isOpen(): boolean {
    return this.connected;
  }

  send(): void {
    // Subscriptions are the only outbound channel; nothing to queue here.
  }

  sendPing(): void {
    // graphql-ws handles protocol-level keep-alive via `keepAlive`.
  }

  /**
   * Register a subscription. It is (re-)established immediately and again after
   * every reconnect driven by the supervisor.
   */
  subscribe(id: string, entry: SubscriptionEntry): () => void {
    logger.debug('[GraphQLWsTransport] Registering subscription', {
      id,
      operationName: (entry.query.definitions[0] as any)?.name?.value,
    });
    this.subscriptions.set(id, entry);
    const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
    const unregisterResubscribe = supervisor?.registerResubscribe(`graphql:${id}`, () => {
      this.resubscribe(id);
    });
    this.resubscribe(id);
    return () => {
      logger.debug('[GraphQLWsTransport] Unregistering subscription', { id });
      this.unsubscribes.get(id)?.();
      this.unsubscribes.delete(id);
      this.subscriptions.delete(id);
      unregisterResubscribe?.();
    };
  }

  private resubscribeAll(): void {
    if (this.resubscribeInProgress) {
      logger.debug('[GraphQLWsTransport] Resubscribe already in progress, skipping');
      return;
    }

    this.resubscribeInProgress = true;
    const subscriptionIds = Array.from(this.subscriptions.keys());
    logger.debug('[GraphQLWsTransport] Resubscribing all subscriptions', {
      count: subscriptionIds.length,
      ids: subscriptionIds,
    });

    try {
      this.subscriptions.forEach((_, id) => this.resubscribe(id));
    } finally {
      this.resubscribeInProgress = false;
    }
  }

  private resubscribe(id: string): void {
    const entry = this.subscriptions.get(id);
    const client = this.client;
    if (!entry) {
      logger.warn('[GraphQLWsTransport] Subscription entry not found during resubscribe', { id });
      return;
    }
    if (!client) {
      logger.warn('[GraphQLWsTransport] WebSocket client not available during resubscribe', { id });
      return;
    }

    try {
      // Unsubscribe from the old subscription if it exists
      const oldUnsubscribe = this.unsubscribes.get(id);
      if (oldUnsubscribe) {
        try {
          oldUnsubscribe();
          logger.debug('[GraphQLWsTransport] Unsubscribed from old subscription', { id });
        } catch (error) {
          logger.warn('[GraphQLWsTransport] Error unsubscribing from old subscription', { id, error });
        }
      }

      // Subscribe to the new subscription
      const unsubscribe = client.subscribe(
        {
          query: print(entry.query),
          variables: entry.variables ?? {},
        },
        {
          next: (result) => {
            try {
              entry.handler(result.data);
            } catch (error) {
              logger.error('[GraphQLWsTransport] Error in subscription handler', { id, error });
            }
          },
          error: (error) => {
            logger.error('[GraphQLWsTransport] Subscription error', { id, error });
            this.events.emitError(error);
          },
          complete: () => {
            logger.debug('[GraphQLWsTransport] Subscription completed', { id });
          },
        },
      );
      this.unsubscribes.set(id, unsubscribe);
      logger.debug('[GraphQLWsTransport] Subscription reestablished', { id });
    } catch (error) {
      logger.error('[GraphQLWsTransport] Error resubscribing', { id, error });
      this.events.emitError(error);
    }
  }
}

/**
 * Creates a GraphQL subscriptions-enabled Apollo Client
 */
export function createSubscriptionClient(config: SubscriptionConfig): ApolloClient<any> {
  const manager = SubscriptionConnectionManager.getInstance();

  // Evaluate feature gate — if a gate is configured and disabled, skip WebSocket entirely
  const subscriptionsEnabled =
    !config.featureGate ||
    isFeatureEnabled(config.featureGate.flagId, config.featureGate.context ?? {});

  // Create HTTP link for queries and mutations (always present)
  const httpLink = new HttpLink({
    uri: config.httpUrl,
    credentials: 'include',
    headers: config.headers,
  });

  // Only build the WebSocket link when the feature is enabled
  const link: ApolloLink = subscriptionsEnabled
    ? (() => {
        const transport = new GraphQLWsTransport(config);
        const { reconnect } = { ...DEFAULT_SUBSCRIPTION_CONFIG, ...config };
        const supervisor = new ConnectionSupervisor(transport, {
          initialReconnectDelayMs: reconnect?.initialDelayMs ?? 1000,
          maxReconnectDelayMs: reconnect?.maxDelayMs ?? 30000,
          maxReconnectAttempts: reconnect?.maxRetries ?? 5,
        });

        // Mirror the supervisor status into the legacy connection manager so
        // existing `getConnectionManager()` consumers keep working.
        supervisor.onStatusChange((status) => {
          if (status.isConnected) {
            manager.setState(ConnectionState.CONNECTED);
            manager.resetRetryCount();
          } else if (status.phase === 'connecting' || status.phase === 'reconnecting') {
            manager.setState(ConnectionState.CONNECTING);
          } else if (status.phase === 'offline') {
            manager.setState(
              ConnectionState.ERROR,
              new Error(status.lastError ?? 'Realtime connection unavailable'),
            );
          } else {
            manager.setState(ConnectionState.DISCONNECTED);
          }
        });

        registerSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION, supervisor);
        supervisor.connect();

        const wsClient = transport.getClient()!;
        const wsLink = new GraphQLWsLink(wsClient);

        return split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
            );
          },
          wsLink,
          httpLink,
        );
      })()
    : httpLink;

  // Create Apollo Client
  const client = new ApolloClient({
    link: ApolloLink.from([link]),
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
 * Subscribe to a realtime event through the GraphQL supervisor. The subscription
 * is automatically restored after every reconnect (resubscribe registry).
 *
 * @param id - Unique subscription identifier
 * @param query - GraphQL subscription document
 * @param variables - Variables to pass to the subscription
 * @param handler - Callback function to handle incoming data
 * @returns unsubscribe function
 */
export function subscribeRealtime(
  id: string,
  query: DocumentNode,
  variables: Record<string, unknown>,
  handler: (payload: any) => void,
): () => void {
  const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
  const transport = supervisor?.getTransport() as GraphQLWsTransport | undefined;
  if (!supervisor || !transport) {
    logger.warn('[GraphQLSubscriptions] No active subscription supervisor; subscription dropped', {
      id,
    });
    return () => undefined;
  }
  logger.debug('[GraphQLSubscriptions] Subscribing to realtime event', {
    id,
    operationName: (query.definitions[0] as any)?.name?.value,
  });
  return transport.subscribe(id, { query, variables, handler });
}

/**
 * Get all active subscription IDs for the GraphQL connection
 */
export function getActiveSubscriptions(): string[] {
  const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
  const transport = supervisor?.getTransport() as GraphQLWsTransport | undefined;
  if (!transport) {
    return [];
  }
  return transport.getActiveSubscriptionIds();
}

/**
 * Get the count of active subscriptions for the GraphQL connection
 */
export function getActiveSubscriptionCount(): number {
  const supervisor = getSupervisor(GRAPHQL_SUBSCRIPTIONS_CONNECTION);
  const transport = supervisor?.getTransport() as GraphQLWsTransport | undefined;
  if (!transport) {
    return 0;
  }
  return transport.getActiveSubscriptionCount();
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
  constructor(public code: string, public details?: Record<string, any>) {
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
