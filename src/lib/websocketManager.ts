'use client';

import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  namespace?: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  heartbeatInterval?: number;
  timeout?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastConnected?: Date;
  lastError?: string;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, Socket> = new Map();
  private configs: Map<string, WebSocketConfig> = new Map();
  private statuses: Map<string, ConnectionStatus> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(key: string, config: WebSocketConfig): Socket {
    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    const socket = io(config.url + (config.namespace || ''), {
      reconnection: false,
      timeout: config.timeout || 20000,
      forceNew: true,
    });

    this.connections.set(key, socket);
    this.configs.set(key, config);
    this.setupSocketListeners(key, socket, config);
    this.startHeartbeat(key, config);

    socket.connect();
    return socket;
  }

  disconnect(key: string): void {
    const socket = this.connections.get(key);
    if (socket) {
      socket.disconnect();
      this.connections.delete(key);
    }
    this.cleanup(key);
  }

  getStatus(key: string): ConnectionStatus {
    return (
      this.statuses.get(key) || {
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: 0,
      }
    );
  }

  getSocket(key: string): Socket | null {
    return this.connections.get(key) || null;
  }

  getAllStatuses(): Record<string, ConnectionStatus> {
    const result: Record<string, ConnectionStatus> = {};
    this.statuses.forEach((status, key) => {
      result[key] = status;
    });
    return result;
  }

  private setupSocketListeners(key: string, socket: Socket, config: WebSocketConfig): void {
    socket.on('connect', () => {
      this.updateStatus(key, {
        isConnected: true,
        isReconnecting: false,
        reconnectAttempts: 0,
        lastConnected: new Date(),
        lastError: undefined,
      });
    });

    socket.on('disconnect', (reason) => {
      this.updateStatus(key, {
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: this.getStatus(key).reconnectAttempts,
        lastError: `Disconnected: ${reason}`,
      });

      if (reason !== 'io client disconnect') {
        this.scheduleReconnect(key, config);
      }
    });

    socket.on('connect_error', (error) => {
      this.updateStatus(key, {
        isConnected: false,
        isReconnecting: false,
        reconnectAttempts: this.getStatus(key).reconnectAttempts,
        lastError: error.message,
      });

      this.scheduleReconnect(key, config);
    });

    socket.on('pong', () => {
      const currentStatus = this.getStatus(key);
      if (currentStatus.lastError) {
        this.updateStatus(key, { ...currentStatus, lastError: undefined });
      }
    });
  }

  private updateStatus(key: string, updates: Partial<ConnectionStatus>): void {
    const currentStatus = this.getStatus(key);
    this.statuses.set(key, { ...currentStatus, ...updates });
  }

  private scheduleReconnect(key: string, config: WebSocketConfig): void {
    const status = this.getStatus(key);
    const maxAttempts = config.reconnectionAttempts || 5;

    if (status.reconnectAttempts >= maxAttempts) {
      this.updateStatus(key, {
        isReconnecting: false,
        lastError: `Max reconnection attempts (${maxAttempts}) reached`,
      });
      return;
    }

    this.updateStatus(key, {
      isReconnecting: true,
      reconnectAttempts: status.reconnectAttempts + 1,
    });

    const delay = (config.reconnectionDelay || 1000) * Math.pow(2, status.reconnectAttempts);
    const timeout = setTimeout(() => {
      this.attemptReconnect(key);
    }, delay);

    this.reconnectTimeouts.set(key, timeout);
  }

  private attemptReconnect(key: string): void {
    const socket = this.connections.get(key);
    if (socket && !socket.connected) {
      socket.connect();
    }
  }

  private startHeartbeat(key: string, config: WebSocketConfig): void {
    const interval = config.heartbeatInterval || 30000;
    const heartbeat = setInterval(() => {
      const socket = this.connections.get(key);
      if (socket && socket.connected) {
        socket.emit('ping');
      }
    }, interval);

    this.heartbeatIntervals.set(key, heartbeat);
  }

  private cleanup(key: string): void {
    const heartbeat = this.heartbeatIntervals.get(key);
    if (heartbeat) {
      clearInterval(heartbeat);
      this.heartbeatIntervals.delete(key);
    }

    const timeout = this.reconnectTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(key);
    }

    this.configs.delete(key);
    this.statuses.delete(key);
  }

  disconnectAll(): void {
    this.connections.forEach((_, key) => {
      this.disconnect(key);
    });
  }
}

export const wsManager = WebSocketManager.getInstance();
