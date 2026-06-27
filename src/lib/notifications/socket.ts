import type { BaseNotification, NotificationEvent } from './types';

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

export class NotificationSocketService {
  private ws: WebSocket | null = null;
  private readonly listeners = new Set<NotificationListener>();
  private readonly connectionListeners = new Set<ConnectionStateListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay: number;
  private readonly initialReconnectDelay: number;
  private readonly maxReconnectDelay: number;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectJitter: number;
  private intentionallyClosed = false;
  private reconnectAttempts = 0;
  private connectionState: NotificationSocketConnectionState = {
    status: 'idle',
    reconnectAttempts: 0,
  };
  private readonly outboundQueue: OutboundMessage[] = [];
  private readonly handleOnline = () => {
    if (!this.intentionallyClosed && !this.isOpen()) {
      this.clearReconnectTimer();
      this.open();
    }
  };
  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this.handleOnline();
    }
  };

  constructor(private readonly url: string, options: NotificationSocketOptions = {}) {
    this.initialReconnectDelay = options.initialReconnectDelay ?? DEFAULT_INITIAL_RECONNECT_DELAY;
    this.maxReconnectDelay = options.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;
    this.reconnectJitter = options.reconnectJitter ?? DEFAULT_RECONNECT_JITTER;
    this.reconnectDelay = this.initialReconnectDelay;
  }

  connect(): void {
    this.intentionallyClosed = false;
    this.registerNetworkListeners();
    this.open();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.unregisterNetworkListeners();
    this.clearReconnectTimer();
    this.ws?.close();
    this.ws = null;
    this.outboundQueue.length = 0;
    this.updateConnectionState({
      status: 'disconnected',
      reconnectAttempts: 0,
      lastError: undefined,
    });
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

  send(event: NotificationEventType, payload: unknown): void {
    const message: OutboundMessage = { event, payload };

    if (this.isOpen()) {
      this.ws?.send(JSON.stringify({ event, payload }));
      return;
    }

    this.outboundQueue.push(message);
  }

  private open(): void {
    if (this.ws || this.intentionallyClosed) {
      return;
    }

    if (this.hasReachedMaxAttempts()) {
      this.updateConnectionState({
        status: 'disconnected',
        reconnectAttempts: this.reconnectAttempts,
        lastError: `Max reconnection attempts (${this.maxReconnectAttempts}) reached`,
      });
      return;
    }

    try {
      this.updateConnectionState({
        status: this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting',
        reconnectAttempts: this.reconnectAttempts,
      });

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectDelay = this.initialReconnectDelay;
        this.reconnectAttempts = 0;
        this.updateConnectionState({
          status: 'connected',
          reconnectAttempts: 0,
          lastConnectedAt: new Date(),
          lastError: undefined,
        });
        this.flushOutboundQueue();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as NotificationEvent;
          if (data.event === 'notification') {
            const notification = data.payload as BaseNotification;
            notification.timestamp = new Date(notification.timestamp);
            this.listeners.forEach((listener) => listener(notification));
          }
        } catch {
          console.warn('[NotificationSocket] Failed to parse message', event.data);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.intentionallyClosed) {
          this.updateConnectionState({
            status: 'disconnected',
            reconnectAttempts: this.reconnectAttempts,
          });
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.updateConnectionState({
          status: 'disconnected',
          reconnectAttempts: this.reconnectAttempts,
          lastError: 'WebSocket connection error',
        });
        this.ws?.close();
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open WebSocket';
      console.error('[NotificationSocket] Failed to open', error);
      this.updateConnectionState({
        status: 'disconnected',
        reconnectAttempts: this.reconnectAttempts,
        lastError: message,
      });
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionallyClosed || this.reconnectTimer || this.hasReachedMaxAttempts()) {
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.getReconnectDelay();

    this.updateConnectionState({
      status: 'reconnecting',
      reconnectAttempts: this.reconnectAttempts,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, delay);
  }

  private getReconnectDelay(): number {
    const jitterRange = this.reconnectDelay * this.reconnectJitter;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    return Math.max(0, Math.round(this.reconnectDelay + jitter));
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private flushOutboundQueue(): void {
    if (!this.isOpen() || this.outboundQueue.length === 0) {
      return;
    }

    const queuedMessages = [...this.outboundQueue];
    this.outboundQueue.length = 0;

    queuedMessages.forEach(({ event, payload }) => {
      this.ws?.send(JSON.stringify({ event, payload }));
    });
  }

  private isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private hasReachedMaxAttempts(): boolean {
    return this.maxReconnectAttempts > 0 && this.reconnectAttempts >= this.maxReconnectAttempts;
  }

  private updateConnectionState(updates: Partial<NotificationSocketConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates,
      reconnectAttempts: updates.reconnectAttempts ?? this.connectionState.reconnectAttempts,
    };
    this.connectionListeners.forEach((listener) => listener(this.connectionState));
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
