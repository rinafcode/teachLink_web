'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {
  NotificationSocketService,
  type NotificationSocketConnectionState,
} from '@/lib/notifications/socket';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'message'
  | 'course'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────────────────────

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  connectionState: NotificationSocketConnectionState;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}

// ──────────────────────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────────────────────

interface NotificationProviderProps {
  children: ReactNode;
  /** WebSocket endpoint, e.g. "wss://api.example.com/notifications" */
  wsUrl: string;
  /** Initial notifications fetched server-side / from cache */
  initialNotifications?: Notification[];
  /** Max number of notifications to keep in memory */
  maxNotifications?: number;
}

const DEFAULT_CONNECTION_STATE: NotificationSocketConnectionState = {
  status: 'idle',
  reconnectAttempts: 0,
};

export function NotificationProvider({
  children,
  wsUrl,
  initialNotifications = [],
  maxNotifications = 200,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [connectionState, setConnectionState] =
    useState<NotificationSocketConnectionState>(DEFAULT_CONNECTION_STATE);
  const serviceRef = useRef<NotificationSocketService | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = useCallback(
    (notification: Notification) => {
      setNotifications((prev) => {
        const next = [notification, ...prev];
        return next.slice(0, maxNotifications);
      });
    },
    [maxNotifications],
  );

  useEffect(() => {
    const svc = new NotificationSocketService(wsUrl);
    serviceRef.current = svc;
    svc.connect();

    const unsubscribeNotifications = svc.subscribe(addNotification);
    const unsubscribeConnection = svc.onConnectionStateChange(setConnectionState);

    return () => {
      unsubscribeNotifications();
      unsubscribeConnection();
      svc.disconnect();
    };
  }, [wsUrl, addNotification]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    serviceRef.current?.send('notification_read', { id });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    serviceRef.current?.send('notification_read', { all: true });
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    serviceRef.current?.send('notification_clear', { id });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    serviceRef.current?.send('notification_clear', { all: true });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        connectionState,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
