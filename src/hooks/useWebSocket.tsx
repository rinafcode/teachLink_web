'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Socket } from 'socket.io-client';
import { wsManager, WebSocketConfig, ConnectionStatus } from '@/lib/websocketManager';

export interface UseWebSocketOptions extends Omit<WebSocketConfig, 'url'> {
  url?: string;
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: string) => void;
  onReconnect?: () => void;
}

export interface UseWebSocketReturn {
  socket: Socket | null;
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempts: number;
  lastError?: string;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler?: (...args: unknown[]) => void) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  connectionKey: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001',
    enabled = true,
    namespace,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    heartbeatInterval = 30000,
    timeout = 20000,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempts: 0,
  });

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const updateStatus = useCallback(() => {
    const currentStatus = wsManager.getStatus(connectionKey);
    setStatus(currentStatus);
  }, [connectionKey]);

  useEffect(() => {
    if (!enabled) return;

    const config: WebSocketConfig = {
      url,
      namespace,
      reconnectionAttempts,
      reconnectionDelay,
      heartbeatInterval,
      timeout,
    };

    const socket = wsManager.connect(connectionKey, config);
    socketRef.current = socket;

    const handleConnect = () => {
      updateStatus();
      onConnect?.();
    };

    const handleDisconnect = (reason: string) => {
      updateStatus();
      onDisconnect?.(reason);
    };

    const handleConnectError = (error: Error) => {
      updateStatus();
      onError?.(error.message);
    };

    const handleReconnect = () => {
      updateStatus();
      onReconnect?.();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect', handleReconnect);

    statusCheckInterval.current = setInterval(updateStatus, 1000);
    updateStatus();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect', handleReconnect);

      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }

      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          socket.off(event, handler as (...args: unknown[]) => void);
        });
      });
      listenersRef.current.clear();

      wsManager.disconnect(connectionKey);
    };
  }, [
    enabled,
    connectionKey,
    url,
    namespace,
    reconnectionAttempts,
    reconnectionDelay,
    heartbeatInterval,
    timeout,
    onConnect,
    onDisconnect,
    onError,
    onReconnect,
    updateStatus,
  ]);

  const emit = useCallback((event: string, data?: unknown) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on(event, handler);

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    const socket = socketRef.current;
    if (!socket) return;

    if (handler) {
      socket.off(event, handler);
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    } else {
      socket.off(event);
      listenersRef.current.delete(event);
    }
  }, []);

  const reconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect(connectionKey);
  }, [connectionKey]);

  return {
    socket: socketRef.current,
    status,
    isConnected: status.isConnected,
    isReconnecting: status.isReconnecting,
    reconnectAttempts: status.reconnectAttempts,
    lastError: status.lastError,
    emit,
    on,
    off,
    reconnect,
    disconnect,
  };
}
