import type { BaseNotification, NotificationEvent } from './types';
import { createLogger } from '@/lib/logging';
import {
  ConnectionSupervisor,
  RawWebSocketTransport,
  type ConnectionStatus,
  registerSupervisor,
} from '@/lib/realtime/connectionSupervisor';
import { tokenManager } from '@/lib/auth/tokenManager';

const logger = createLogger('notification-socket');

export type NotificationEventType = NotificationEvent['event'];

export type NotificationSocketStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting';

export interface NotificationSocketConnectionState {
  status: NotificationSocketStatus;
  reconnectAttempts: number;
  lastConnectedAt?: Date;
  lastError?: string;
}

export interface NotificationSocketOptions {
  initialReconnectDelay?: number;
  maxReconnectDelay?: number;
  maxReconnectAttempts?: number;
  reconnectJitter?: number;
}

type NotificationListener = (notification: BaseNotification) => void;
type ConnectionStateListener = (state: NotificationSocketConnectionState) => void;

interface OutboundMessage {
  event: NotificationEventType;
  payload: unknown;
}

const DEFAULT_INITIAL_RECONNECT_DELAY = 1_000;
const DEFAULT_MAX_RECONNECT_DELAY = 30_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 0;
const DEFAULT_RECONNECT_JITTER = 0.2;

/**
 * Notification WebSocket service. The raw socket I/O lives in
 * `RawWebSocketTransport`; the connect/reconnect/heartbeat/queue lifecycle is
 * delegated to a `ConnectionSupervisor` so notifications share the same unified
 * status shape, jittered backoff and bounded outbound queue as every other
 * realtime transport in the app.
 */
export class NotificationSocketService {
  private readonly transport: RawWebSocketTransport;
  private readonly supervisor: ConnectionSupervisor;
  private readonly listeners = new Set<NotificationListener>();
  private readonly connectionListeners = new Set<ConnectionStateListener>();
  private intentionallyClosed = false;
  private connectionState: NotificationSocketConnectionState = {
    status: 'idle',
    reconnectAttempts: 0,
  };
  private readonly authUnsubscribers: Array<() => void> = [];
  private readonly handleTokenRotated = ({ accessToken }: { accessToken: string }) => {
    // Re-authenticate through the supervisor's queue so a rotated token keeps
    // the connection valid (flushed immediately when connected, queued if not).
    this.supervisor.send({ event: 'authenticate', payload: { token: accessToken } });
  };
  private readonly handleTokenRevoked = () => {
    // The session was revoked — tear the socket down so it cannot keep
    // receiving notifications under a dead credential.
    this.disconnect();
  };
  private readonly handleOnline = () => {
    if (!this.intentionallyClosed) {
      this.supervisor.reconnectNow();
    }
  };
  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.handleOnline();
    }
  };

  constructor(url: string, options: NotificationSocketOptions = {}) {
    this.transport = new RawWebSocketTransport(url);
    this.supervisor = new ConnectionSupervisor(this.transport, {
      initialReconnectDelayMs: options.initialReconnectDelay ?? DEFAULT_INITIAL_RECONNECT_DELAY,
      maxReconnectDelayMs: options.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY,
      maxReconnectAttempts: options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
      reconnectJitter: options.reconnectJitter ?? DEFAULT_RECONNECT_JITTER,
    });
    this.transport.onMessage((payload) => this.handleIncoming(payload));
    this.supervisor.onStatusChange((status) => {
      this.updateConnectionState(this.mapSupervisorStatus(status));
    });
    registerSupervisor('notifications', this.supervisor);
  }

  connect(): void {
    this.intentionallyClosed = false;
    this.registerNetworkListeners();
    this.registerAuthListeners();
    this.supervisor.connect();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.unregisterNetworkListeners();
    this.unregisterAuthListeners();
    this.supervisor.disconnect();
  }

  subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onConnectionStateChange(listener: ConnectionStateListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.connectionState);
    return () => this.connectionListeners.delete(listener);
  }

  getConnectionState(): NotificationSocketConnectionState {
    return this.connectionState;
  }

  /** Send an outbound message through the supervisor's bounded, ordered queue. */
  send(event: NotificationEventType, payload: unknown): void {
    const message: OutboundMessage = { event, payload };
    this.supervisor.send(message);
  }

  private handleIncoming(payload: unknown): void {
    try {
      const data = JSON.parse(payload as string) as NotificationEvent;
      if (data.event === 'notification') {
        const notification = data.payload as BaseNotification;
        notification.timestamp = new Date(notification.timestamp);
        this.listeners.forEach((listener) => listener(notification));
      }
    } catch {
      logger.warn('[NotificationSocket] Failed to parse message', { data: payload });
    }
  }

  private mapSupervisorStatus(status: ConnectionStatus): NotificationSocketConnectionState {
    switch (status.phase) {
      case 'idle':
        return { status: 'idle', reconnectAttempts: status.reconnectAttempts };
      case 'connecting':
        return {
          status: status.reconnectAttempts > 0 ? 'reconnecting' : 'connecting',
          reconnectAttempts: status.reconnectAttempts,
        };
      case 'reconnecting':
        return { status: 'reconnecting', reconnectAttempts: status.reconnectAttempts };
      case 'connected':
        return {
          status: 'connected',
          reconnectAttempts: 0,
          lastConnectedAt: status.lastConnectedAt,
          lastError: undefined,
        };
      case 'disconnected':
      case 'offline':
        return {
          status: 'disconnected',
          reconnectAttempts: status.reconnectAttempts,
          lastError: status.lastError,
        };
    }
  }

  private updateConnectionState(updates: Partial<NotificationSocketConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates,
      reconnectAttempts: updates.reconnectAttempts ?? this.connectionState.reconnectAttempts,
    };
    this.connectionListeners.forEach((listener) => listener(this.connectionState));
  }

  private registerAuthListeners(): void {
    if (this.authUnsubscribers.length > 0) {
      return;
    }
    this.authUnsubscribers.push(
      tokenManager.on('token:rotated', this.handleTokenRotated),
      tokenManager.on('token:revoked', this.handleTokenRevoked),
    );
  }

  private unregisterAuthListeners(): void {
    this.authUnsubscribers.forEach((off) => off());
    this.authUnsubscribers.length = 0;
  }

  private registerNetworkListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.handleOnline);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private unregisterNetworkListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('online', this.handleOnline);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
}
