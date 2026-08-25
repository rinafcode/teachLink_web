'use client';

import { io, Socket } from 'socket.io-client';
import {
  BaseRealtimeTransport,
  ConnectionSupervisor,
  type ConnectionStatus,
  registerSupervisor,
} from '@/lib/realtime/connectionSupervisor';
import { tokenManager } from '@/lib/auth/tokenManager';

export interface WebSocketConfig {
  url: string;
  namespace?: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export type { ConnectionStatus };

/**
 * socket.io transport adapter. Reconnection is disabled at the socket.io level
 * (`reconnection: false`) so the ConnectionSupervisor owns the reconnect loop,
 * heartbeat and outbound queue; this adapter only maps socket.io events onto
 * the transport lifecycle hooks.
 */
class SocketIoTransport extends BaseRealtimeTransport {
  readonly name = 'socket.io';
  private socket: Socket | null = null;

  constructor(private readonly config: WebSocketConfig) {
    super();
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }
    this.socket?.removeAllListeners();
    this.socket?.disconnect();

    const socket = io(this.config.url + (this.config.namespace || ''), {
      reconnection: false,
      timeout: this.config.timeout || 20000,
      forceNew: true,
    });
    this.socket = socket;

    socket.on('connect', () => this.events.emitOpen());
    socket.on('disconnect', (reason: string) => this.events.emitClose(reason));
    socket.on('connect_error', (error: Error) => this.events.emitError(error));
    socket.on('pong', () => this.events.emitPong());

    socket.connect();
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }

  close(): void {
    this.socket?.disconnect();
  }

  isOpen(): boolean {
    return this.socket?.connected ?? false;
  }

  send(payload: unknown): void {
    const { event, payload: data } = payload as { event: string; payload?: unknown };
    this.socket?.emit(event, data);
  }

  sendPing(): void {
    this.socket?.emit('ping');
  }
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private supervisors: Map<string, ConnectionSupervisor> = new Map();
  private transports: Map<string, SocketIoTransport> = new Map();
  private configs: Map<string, WebSocketConfig> = new Map();

  private constructor() {
    // React to the shared token lifecycle: re-authenticate live sockets when the
    // access token rotates, and drop every connection when the session is
    // revoked so a stale/expired credential can never keep receiving data.
    tokenManager.on('token:rotated', ({ accessToken }) => {
      this.reauthenticateAll(accessToken);
    });
    tokenManager.on('token:revoked', () => {
      this.disconnectAll();
    });
  }

  private reauthenticateAll(accessToken: string): void {
    this.transports.forEach((transport) => {
      const socket = transport.getSocket();
      if (socket?.connected) {
        socket.emit('authenticate', { token: accessToken });
      }
    });
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(key: string, config: WebSocketConfig): Socket {
    const existing = this.supervisors.get(key);
    if (existing) {
      return this.transports.get(key)!.getSocket()!;
    }

    const transport = new SocketIoTransport(config);
    const supervisor = new ConnectionSupervisor(transport, {
      initialReconnectDelayMs: config.reconnectionDelay ?? 1000,
      maxReconnectAttempts: config.reconnectionAttempts ?? 5,
      maxReconnectDelayMs: (config.reconnectionDelay ?? 1000) * 32,
      heartbeatIntervalMs: config.heartbeatInterval ?? 30000,
    });

    this.supervisors.set(key, supervisor);
    this.transports.set(key, transport);
    this.configs.set(key, config);
    registerSupervisor(`websocket:${key}`, supervisor);

    supervisor.connect();
    return transport.getSocket()!;
  }

  /**
   * Send an event through the supervisor's bounded outbound queue. Messages sent
   * while disconnected are buffered (FIFO) and flushed on reconnect; overflow
   * follows the supervisor's drop-oldest policy.
   */
  send(key: string, event: string, payload?: unknown): void {
    const supervisor = this.supervisors.get(key);
    if (!supervisor) {
      return;
    }
    supervisor.send({ event, payload });
  }

  /** Join a socket.io room and automatically re-join it after every reconnect. */
  joinRoom(key: string, room: string): () => void {
    const supervisor = this.supervisors.get(key);
    const socket = this.getSocket(key);
    if (!supervisor || !socket) {
      return () => undefined;
    }
    socket.emit('join', { room });
    return supervisor.registerResubscribe(`room:${room}`, () => {
      this.getSocket(key)?.emit('join', { room });
    });
  }

  disconnect(key: string): void {
    const supervisor = this.supervisors.get(key);
    if (supervisor) {
      supervisor.disconnect();
      this.supervisors.delete(key);
    }
    this.transports.delete(key);
    this.configs.delete(key);
  }

  getStatus(key: string): ConnectionStatus {
    return (
      this.supervisors.get(key)?.getStatus() || {
        phase: 'idle',
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        queuedCount: 0,
      }
    );
  }

  getSocket(key: string): Socket | null {
    return this.transports.get(key)?.getSocket() || null;
  }

  getAllStatuses(): Record<string, ConnectionStatus> {
    const result: Record<string, ConnectionStatus> = {};
    this.supervisors.forEach((supervisor, key) => {
      result[key] = supervisor.getStatus();
    });
    return result;
  }

  disconnectAll(): void {
    this.supervisors.forEach((_, key) => {
      this.disconnect(key);
    });
  }
}

export const wsManager = WebSocketManager.getInstance();
