/**
 * ConnectionSupervisor — transport-agnostic realtime connection lifecycle.
 *
 * All realtime transports in the app (socket.io via `src/lib/websocketManager.ts`,
 * the hand-rolled notification WebSocket in `src/lib/notifications/socket.ts` and
 * GraphQL subscriptions in `src/lib/graphql/subscriptions.ts`) delegate their
 * connect/reconnect/heartbeat lifecycle to this supervisor so every consumer sees
 * one unified `ConnectionStatus` shape and identical reliability behaviour.
 *
 * Delivery guarantees (outbound):
 * - `send()` while connected delivers immediately through the transport.
 * - `send()` while disconnected is queued (bounded by `queueLimit`) and flushed
 *   in FIFO order on the next successful connect.
 * - Overflow is bounded by the queue policy:
 *   - `'drop-oldest'` (default): the oldest queued message is dropped to make room,
 *     a `queue_dropped` metric is emitted.
 *   - `'block'`: the new message is dropped, a `queue_dropped` metric is emitted.
 *
 * Delivery guarantees (inbound):
 * - Messages carrying a numeric `sequence` envelope are tracked; a gap between the
 *   last seen sequence and the incoming sequence triggers the registered catch-up
 *   handler (used to backfill events missed while the transport was down).
 *
 * Reconnection:
 * - Exponential backoff with configurable jitter (full jitter by default).
 * - A shared heartbeat (ping / pong with ping-timeout detection) triggers an
 *   immediate reconnect when the peer stops answering.
 * - Rooms/subscriptions registered via `registerResubscribe()` are automatically
 *   restored after every (re)connect, and `onReconnect()` callbacks run afterwards
 *   so the synchronization engine can backfill the gap window.
 * - Once `maxReconnectAttempts` is exceeded the supervisor degrades to `offline`
 *   mode: it emits a `realtime_offline` metric, raises a reconnect-failure alert
 *   (see `src/lib/monitoring/alerts.ts`) and signals the service worker so the app
 *   can switch to offline mode.
 */

import { createLogger } from '@/lib/logging';
import { createCounterMetric } from '@/lib/logging/performance';
import {
  REALTIME_HEARTBEAT_INTERVAL_MS,
  REALTIME_HEARTBEAT_TIMEOUT_MS,
  REALTIME_OFFLINE_EVENT,
  REALTIME_OUTBOUND_QUEUE_LIMIT,
  REALTIME_QUEUE_POLICY,
  REALTIME_RECONNECT_BASE_DELAY_MS,
  REALTIME_RECONNECT_JITTER,
  REALTIME_RECONNECT_MAX_ATTEMPTS,
  REALTIME_RECONNECT_MAX_DELAY_MS,
} from '@/constants/app.constants';

const logger = createLogger('connection-supervisor');

export type ConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'offline';

/** Unified connection status shared by every realtime consumer hook. */
export interface ConnectionStatus {
  phase: ConnectionPhase;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: Date;
  /** @deprecated Alias of `lastConnectedAt`, kept for backwards compatibility. */
  lastConnected?: Date;
  lastError?: string;
  /** Number of messages currently buffered by the outbound queue. */
  queuedCount: number;
  /** Highest inbound sequence observed (set when the transport sends sequenced envelopes). */
  lastSequence?: number;
}

export type QueuePolicy = 'drop-oldest' | 'block';

export interface ConnectionSupervisorOptions {
  /** Base delay for the first reconnect attempt (ms). Default 1000. */
  initialReconnectDelayMs?: number;
  /** Ceiling for the exponential backoff delay (ms). Default 30000. */
  maxReconnectDelayMs?: number;
  /** Max reconnect attempts before degrading to offline. 0 = retry forever. Default 5. */
  maxReconnectAttempts?: number;
  /** Jitter factor 0..1 applied to the backoff delay. 1 = full jitter. Default 1. */
  reconnectJitter?: number;
  /** How often to ping the peer (ms). Default 30000. */
  heartbeatIntervalMs?: number;
  /** Max time without a pong before forcing a reconnect (ms). Default 10000. */
  heartbeatTimeoutMs?: number;
  /** Bound of the outbound queue. Default 100. */
  queueLimit?: number;
  /** Overflow policy for a full outbound queue. Default 'drop-oldest'. */
  queuePolicy?: QueuePolicy;
  /**
   * When false the transport owns reconnection (e.g. y-websocket); the supervisor
   * only mirrors status, heartbeat and queueing. Default true.
   */
  manageReconnect?: boolean;
}

/**
 * A transport-agnostic socket abstraction. Transports implement this interface and
 * feed lifecycle events back to the supervisor through the `on*` hooks.
 */
export interface RealtimeTransport {
  readonly name: string;
  connect(): void;
  disconnect(): void;
  close(): void;
  isOpen(): boolean;
  /** Deliver an outbound payload (already serialized by the caller if needed). */
  send(payload: unknown): void;
  /** Send a protocol-level heartbeat ping. */
  sendPing(): void;
  onOpen(handler: () => void): () => void;
  onClose(handler: (reason?: string) => void): () => void;
  onError(handler: (error: unknown) => void): () => void;
  onMessage(handler: (payload: unknown) => void): () => void;
  onPong(handler: () => void): () => void;
}

/** Minimal event bus used by transport implementations to fan out lifecycle events. */
export class TransportEventBus {
  private readonly openHandlers = new Set<() => void>();
  private readonly closeHandlers = new Set<(reason?: string) => void>();
  private readonly errorHandlers = new Set<(error: unknown) => void>();
  private readonly messageHandlers = new Set<(payload: unknown) => void>();
  private readonly pongHandlers = new Set<() => void>();

  onOpen(handler: () => void): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: (reason?: string) => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  onError(handler: (error: unknown) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onMessage(handler: (payload: unknown) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onPong(handler: () => void): () => void {
    this.pongHandlers.add(handler);
    return () => this.pongHandlers.delete(handler);
  }

  emitOpen(): void {
    this.openHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        logger.warn('[TransportEventBus] open handler failed', { error });
      }
    });
  }

  emitClose(reason?: string): void {
    this.closeHandlers.forEach((handler) => {
      try {
        handler(reason);
      } catch (error) {
        logger.warn('[TransportEventBus] close handler failed', { error });
      }
    });
  }

  emitError(error: unknown): void {
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (handlerError) {
        logger.warn('[TransportEventBus] error handler failed', { error: handlerError });
      }
    });
  }

  emitMessage(payload: unknown): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        logger.warn('[TransportEventBus] message handler failed', { error });
      }
    });
  }

  emitPong(): void {
    this.pongHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        logger.warn('[TransportEventBus] pong handler failed', { error });
      }
    });
  }
}

/** Base class providing the event plumbing shared by transport implementations. */
export abstract class BaseRealtimeTransport implements RealtimeTransport {
  protected readonly events = new TransportEventBus();

  abstract readonly name: string;
  abstract connect(): void;

  disconnect(): void {
    this.close();
  }

  close(): void {
    // no-op by default
  }

  isOpen(): boolean {
    return false;
  }

  send(_payload: unknown): void {
    // no-op by default
  }

  sendPing(): void {
    // no-op by default
  }

  onOpen(handler: () => void): () => void {
    return this.events.onOpen(handler);
  }

  onClose(handler: (reason?: string) => void): () => void {
    return this.events.onClose(handler);
  }

  onError(handler: (error: unknown) => void): () => void {
    return this.events.onError(handler);
  }

  onMessage(handler: (payload: unknown) => void): () => void {
    return this.events.onMessage(handler);
  }

  onPong(handler: () => void): () => void {
    return this.events.onPong(handler);
  }
}

/** Raw browser `WebSocket` transport (used by notifications + generic websocket hook). */
export class RawWebSocketTransport extends BaseRealtimeTransport {
  readonly name = 'websocket';
  private ws: WebSocket | null = null;

  constructor(private readonly url: string) {
    super();
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => this.events.emitOpen();
    ws.onmessage = (event) => {
      this.events.emitMessage(event.data);
      // Detect protocol-level pongs so the supervisor can reset its heartbeat.
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data) as { type?: string };
          if (parsed && parsed.type === 'pong') {
            this.events.emitPong();
          }
        } catch {
          // not JSON — ignore
        }
      }
    };
    ws.onerror = () => this.events.emitError('WebSocket connection error');
    ws.onclose = () => {
      if (this.ws === ws) {
        this.ws = null;
      }
      this.events.emitClose();
    };
  }

  close(): void {
    this.ws?.close();
  }

  disconnect(): void {
    this.close();
    this.ws = null;
  }

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  send(payload: unknown): void {
    if (this.isOpen()) {
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
      this.ws?.send(data);
    }
  }

  sendPing(): void {
    if (this.isOpen()) {
      this.ws?.send(JSON.stringify({ type: 'ping' }));
    }
  }
}

/** Locally-open transport used to surface a unified status for simulated streams. */
export class LocalRealtimeTransport extends BaseRealtimeTransport {
  readonly name = 'local';
  private opened = false;

  connect(): void {
    if (this.opened) return;
    this.opened = true;
    this.events.emitOpen();
  }

  close(): void {
    this.opened = false;
  }

  isOpen(): boolean {
    return this.opened;
  }
}

export class ConnectionSupervisor {
  private status: ConnectionStatus;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatCheckTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectDelayMs: number;
  private lastPingSentAt = 0;
  private lastPongAt = 0;
  private intentionallyClosed = false;
  private outboundQueue: unknown[] = [];
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>();
  private readonly resubscribeRegistry = new Map<string, () => void>();
  private readonly reconnectCallbacks = new Set<() => void>();
  private catchUpHandler: (() => void) | null = null;
  private readonly transportUnsubscribers: Array<() => void> = [];

  constructor(
    private readonly transport: RealtimeTransport,
    private readonly options: ConnectionSupervisorOptions = {},
  ) {
    this.reconnectDelayMs = options.initialReconnectDelayMs ?? REALTIME_RECONNECT_BASE_DELAY_MS;
    this.status = this.createInitialStatus();
    this.transportUnsubscribers.push(
      transport.onOpen(() => this.handleOpen()),
      transport.onClose((reason) => this.handleClose(reason)),
      transport.onError((error) => this.handleError(error)),
      transport.onMessage((payload) => this.handleMessage(payload)),
      transport.onPong(() => this.handlePong()),
    );
  }

  connect(): void {
    this.intentionallyClosed = false;
    if (this.status.phase === 'connecting' || this.status.phase === 'connected') {
      return;
    }
    this.attemptConnect();
  }

  disconnect(): void {
    this.intentionallyClosed = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.transport.disconnect();
    this.outboundQueue.length = 0;
    this.setStatus({
      phase: 'disconnected',
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastError: undefined,
      queuedCount: 0,
    });
  }

  /**
   * Publish a message with bounded backpressure. See module docs for the exact
   * delivery guarantees (immediate when connected, bounded FIFO queue otherwise,
   * `drop-oldest` or `block` overflow policy).
   */
  send(payload: unknown): void {
    if (this.status.isConnected && this.transport.isOpen()) {
      this.transport.send(payload);
      return;
    }

    this.enqueue(payload);
  }

  /**
   * Buffer an outbound message. Applies the configured queue bound and overflow
   * policy (`drop-oldest` evicts the head to fit the new message; `block`
   * discards the new message). Every eviction emits a `queue_dropped` metric so
   * the pressure on the outbound path is observable.
   */
  private enqueue(payload: unknown): void {
    const limit = this.options.queueLimit ?? REALTIME_OUTBOUND_QUEUE_LIMIT;
    const policy = this.options.queuePolicy ?? REALTIME_QUEUE_POLICY;

    if (limit <= 0) {
      createCounterMetric('queue_dropped', 1, { transport: this.transport.name, policy });
      return;
    }

    if (this.outboundQueue.length >= limit) {
      if (policy === 'drop-oldest') {
        this.outboundQueue.shift();
      }
      createCounterMetric('queue_dropped', 1, { transport: this.transport.name, policy });
      if (policy === 'block') {
        return;
      }
    }

    this.outboundQueue.push(payload);
    this.setStatus({ queuedCount: this.outboundQueue.length });
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getTransport(): RealtimeTransport {
    return this.transport;
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Register a callback that is re-run after every successful (re)connect so that
   * socket rooms, GraphQL subscriptions etc. are automatically restored.
   */
  registerResubscribe(key: string, resubscribe: () => void): () => void {
    this.resubscribeRegistry.set(key, resubscribe);
    return () => {
      this.resubscribeRegistry.delete(key);
    };
  }

  /**
   * Register a callback invoked after each successful (re)connect. Used by the
   * synchronization engine to backfill state missed during the reconnect gap.
   */
  onReconnect(callback: () => void): () => void {
    this.reconnectCallbacks.add(callback);
    return () => this.reconnectCallbacks.delete(callback);
  }

  /** Register (or clear) the handler invoked when an inbound sequence gap is detected. */
  setCatchUpHandler(handler: (() => void) | null): void {
    this.catchUpHandler = handler;
  }

  getLastSequence(): number | undefined {
    return this.status.lastSequence;
  }

  /** Immediately attempt a reconnect, skipping any pending backoff timer. */
  reconnectNow(): void {
    if (this.intentionallyClosed || this.status.isConnected) {
      return;
    }
    this.clearReconnectTimer();
    this.attemptConnect();
  }

  private createInitialStatus(): ConnectionStatus {
    return {
      phase: 'idle',
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0,
      queuedCount: 0,
    };
  }

  private attemptConnect(): void {
    if (this.intentionallyClosed) {
      return;
    }
    this.setStatus({
      phase: 'connecting',
      isConnected: false,
      isReconnecting: this.status.reconnectAttempts > 0,
    });
    try {
      this.transport.connect();
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleOpen(): void {
    const afterAttempts = this.status.reconnectAttempts;
    this.reconnectDelayMs = this.options.initialReconnectDelayMs ?? REALTIME_RECONNECT_BASE_DELAY_MS;
    this.lastPingSentAt = 0;
    this.lastPongAt = Date.now();

    this.setStatus({
      phase: 'connected',
      isConnected: true,
      isReconnecting: false,
      reconnectAttempts: 0,
      lastConnectedAt: new Date(),
      lastConnected: new Date(),
      lastError: undefined,
      queuedCount: this.outboundQueue.length,
    });

    if (afterAttempts > 0) {
      createCounterMetric('reconnect_success', 1, { transport: this.transport.name, afterAttempts });
    }

    this.flushQueue();
    this.startHeartbeat();
    this.runResubscribeRegistry();
    this.runReconnectCallbacks();
  }

  private handleClose(reason?: string): void {
    if (this.intentionallyClosed) {
      return;
    }
    this.stopHeartbeat();
    this.setStatus({
      phase: 'disconnected',
      isConnected: false,
      lastError: reason ? `Disconnected: ${reason}` : undefined,
    });
    this.scheduleReconnect(reason);
  }

  private handleError(error: unknown): void {
    if (this.intentionallyClosed) {
      return;
    }
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unknown connection error';
    this.setStatus({
      phase: 'disconnected',
      isConnected: false,
      lastError: message,
    });
    this.scheduleReconnect(message);
  }

  private handleMessage(payload: unknown): void {
    const message = this.normalizeMessage(payload);
    if (!message || typeof message !== 'object') {
      return;
    }

    const envelope = message as { sequence?: unknown; type?: unknown };
    if (typeof envelope.sequence === 'number') {
      const last = this.status.lastSequence;
      if (last !== undefined && envelope.sequence > last + 1) {
        logger.debug('[ConnectionSupervisor] Inbound sequence gap detected', {
          transport: this.transport.name,
          from: last,
          to: envelope.sequence,
        });
        try {
          this.catchUpHandler?.();
        } catch (error) {
          logger.warn('[ConnectionSupervisor] Catch-up handler failed', { error });
        }
      }
      this.setStatus({ lastSequence: envelope.sequence });
    }
  }

  private handlePong(): void {
    this.lastPongAt = Date.now();
  }

  private scheduleReconnect(reason?: string): void {
    if (this.intentionallyClosed || this.reconnectTimer) {
      return;
    }

    const manageReconnect = this.options.manageReconnect ?? true;
    if (!manageReconnect) {
      // Transport owns reconnection (e.g. y-websocket) — supervisor only mirrors status.
      return;
    }

    const maxAttempts = this.options.maxReconnectAttempts ?? REALTIME_RECONNECT_MAX_ATTEMPTS;
    if (maxAttempts > 0 && this.status.reconnectAttempts >= maxAttempts) {
      this.giveUp();
      return;
    }

    const attempt = this.status.reconnectAttempts + 1;
    this.setStatus({
      phase: 'reconnecting',
      isReconnecting: true,
      reconnectAttempts: attempt,
    });
    createCounterMetric('reconnect_attempt', 1, { transport: this.transport.name, attempt });

    const delay = this.computeBackoffDelay(attempt);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const attempts = this.status.reconnectAttempts;
      if (maxAttempts > 0 && attempts >= maxAttempts) {
        this.giveUp();
        return;
      }
      this.attemptConnect();
    }, delay);
  }

  private computeBackoffDelay(attempt: number): number {
    const base = this.options.initialReconnectDelayMs ?? REALTIME_RECONNECT_BASE_DELAY_MS;
    const max = this.options.maxReconnectDelayMs ?? REALTIME_RECONNECT_MAX_DELAY_MS;
    const jitter = this.options.reconnectJitter ?? REALTIME_RECONNECT_JITTER;
    const exponential = Math.min(base * Math.pow(2, attempt - 1), max);
    if (jitter <= 0) {
      return exponential;
    }
    const low = exponential * (1 - jitter);
    const high = exponential * (1 + jitter);
    const jittered = low + Math.random() * (high - low);
    return Math.min(Math.max(Math.round(jittered), 0), max);
  }

  private giveUp(): void {
    this.stopHeartbeat();
    const maxAttempts = this.options.maxReconnectAttempts ?? REALTIME_RECONNECT_MAX_ATTEMPTS;
    this.setStatus({
      phase: 'offline',
      isConnected: false,
      isReconnecting: false,
      lastError: `Max reconnection attempts (${maxAttempts}) reached`,
    });
    createCounterMetric('realtime_offline', 1, { transport: this.transport.name });
    this.signalOfflineMode();
  }

  private signalOfflineMode(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    try {
      navigator.serviceWorker.controller?.postMessage({ type: REALTIME_OFFLINE_EVENT });
    } catch (error) {
      logger.warn('[ConnectionSupervisor] Failed to signal offline mode to service worker', { error });
    }
  }

  private flushQueue(): void {
    if (this.outboundQueue.length === 0 || !this.transport.isOpen()) {
      return;
    }
    const queued = this.outboundQueue.splice(0, this.outboundQueue.length);
    this.setStatus({ queuedCount: 0 });
    for (const payload of queued) {
      try {
        this.transport.send(payload);
      } catch (error) {
        logger.warn('[ConnectionSupervisor] Failed to flush queued message', { error });
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    const intervalMs = this.options.heartbeatIntervalMs ?? REALTIME_HEARTBEAT_INTERVAL_MS;
    const timeoutMs = this.options.heartbeatTimeoutMs ?? REALTIME_HEARTBEAT_TIMEOUT_MS;

    this.lastPingSentAt = 0;
    this.lastPongAt = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (!this.status.isConnected) {
        return;
      }
      this.lastPingSentAt = Date.now();
      this.transport.sendPing();
    }, intervalMs);

    this.heartbeatCheckTimer = setInterval(() => {
      if (!this.status.isConnected || this.lastPingSentAt === 0) {
        return;
      }
      if (this.lastPongAt < this.lastPingSentAt && Date.now() - this.lastPingSentAt >= timeoutMs) {
        logger.warn('[ConnectionSupervisor] Heartbeat timeout detected', {
          transport: this.transport.name,
        });
        createCounterMetric('heartbeat_timeout', 1, { transport: this.transport.name });
        this.transport.close();
      }
    }, timeoutMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatCheckTimer) {
      clearInterval(this.heartbeatCheckTimer);
      this.heartbeatCheckTimer = null;
    }
    this.lastPingSentAt = 0;
  }

  private runResubscribeRegistry(): void {
    this.resubscribeRegistry.forEach((resubscribe, key) => {
      try {
        resubscribe();
      } catch (error) {
        logger.warn('[ConnectionSupervisor] Resubscribe failed', { key, error });
      }
    });
  }

  private runReconnectCallbacks(): void {
    this.reconnectCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        logger.warn('[ConnectionSupervisor] onReconnect callback failed', { error });
      }
    });
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private normalizeMessage(payload: unknown): unknown {
    if (typeof payload === 'string') {
      try {
        return JSON.parse(payload);
      } catch {
        return payload;
      }
    }
    return payload;
  }

  private setStatus(updates: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...updates };
    this.statusListeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (error) {
        logger.warn('[ConnectionSupervisor] Status listener failed', { error });
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Global registry of named supervisors (one per transport connection).
// Consumers (hooks, synchronization engine) look supervisors up by name so they
// all observe the same unified status without knowing the underlying transport.
// ─────────────────────────────────────────────────────────────────────────────

const supervisors = new Map<string, ConnectionSupervisor>();
const registrationListeners = new Set<(name: string, supervisor: ConnectionSupervisor) => void>();
const reconnectListeners = new Set<() => void>();

export function registerSupervisor(name: string, supervisor: ConnectionSupervisor): () => void {
  supervisors.set(name, supervisor);
  registrationListeners.forEach((listener) => {
    try {
      listener(name, supervisor);
    } catch (error) {
      logger.warn('[ConnectionSupervisor] Registration listener failed', { error });
    }
  });
  return () => {
    if (supervisors.get(name) === supervisor) {
      supervisors.delete(name);
    }
  };
}

export function getSupervisor(name: string): ConnectionSupervisor | undefined {
  return supervisors.get(name);
}

/**
 * Subscribe to supervisor registrations. Replays currently registered supervisors
 * immediately so late subscribers don't miss already-active connections.
 */
export function onSupervisorRegistered(
  listener: (name: string, supervisor: ConnectionSupervisor) => void,
): () => void {
  registrationListeners.add(listener);
  supervisors.forEach((supervisor, name) => {
    try {
      listener(name, supervisor);
    } catch (error) {
      logger.warn('[ConnectionSupervisor] Registration replay failed', { error });
    }
  });
  return () => registrationListeners.delete(listener);
}

/**
 * Subscribe to reconnects across every registered supervisor (including ones
 * registered after this call). Used by the synchronization engine to backfill
 * state after a reconnect gap.
 */
export function onAnyReconnect(callback: () => void): () => void {
  reconnectListeners.add(callback);
  const subscriptions: Array<() => void> = [];
  const attach = (supervisor: ConnectionSupervisor) => {
    subscriptions.push(supervisor.onReconnect(callback));
  };
  supervisors.forEach(attach);
  const removeRegistrationListener = onSupervisorRegistered((_name, supervisor) => attach(supervisor));

  return () => {
    reconnectListeners.delete(callback);
    removeRegistrationListener();
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}
