import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    ReactNode,
  } from "react";
  
  export type NotificationType =
    | "info"
    | "success"
    | "warning"
    | "error"
    | "message"
    | "course"
    | "system";
  
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
  
  type NotificationEventType = "notification" | "notification_read" | "notification_clear";
  
  interface NotificationEvent {
    event: NotificationEventType;
    payload: unknown;
  }
  
  // ──────────────────────────────────────────────────────────────────────────────
  // WebSocket service (singleton per URL)
  // ──────────────────────────────────────────────────────────────────────────────
  
  type Listener = (notification: Notification) => void;
  
  class NotificationSocketService {
    private ws: WebSocket | null = null;
    private listeners: Set<Listener> = new Set();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private reconnectDelay = 1000;
    private maxReconnectDelay = 30_000;
    private intentionallyClosed = false;
  
    constructor(private url: string) {}
  
    connect() {
      this.intentionallyClosed = false;
      this.open();
    }
  
    private open() {
      if (this.ws) return;
      try {
        this.ws = new WebSocket(this.url);
  
        this.ws.onopen = () => {
          console.info("[NotificationSocket] Connected");
          this.reconnectDelay = 1000; // reset back-off
        };
  
        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const data: NotificationEvent = JSON.parse(event.data as string);
            if (data.event === "notification") {
              const notification = data.payload as Notification;
              notification.timestamp = new Date(notification.timestamp);
              this.listeners.forEach((cb) => cb(notification));
            }
          } catch {
            console.warn("[NotificationSocket] Failed to parse message", event.data);
          }
        };
  
        this.ws.onclose = () => {
          this.ws = null;
          if (!this.intentionallyClosed) {
            this.scheduleReconnect();
          }
        };
  
        this.ws.onerror = (err) => {
          console.error("[NotificationSocket] Error", err);
          this.ws?.close();
        };
      } catch (err) {
        console.error("[NotificationSocket] Failed to open", err);
        this.scheduleReconnect();
      }
    }
  
    private scheduleReconnect() {
      this.reconnectTimer = setTimeout(() => {
        console.info(`[NotificationSocket] Reconnecting…`);
        this.open();
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }, this.reconnectDelay);
    }
  
    disconnect() {
      this.intentionallyClosed = true;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.ws?.close();
      this.ws = null;
    }
  
    subscribe(listener: Listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
  
    send(event: NotificationEventType, payload: unknown) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event, payload }));
      }
    }
  }
  
  // ──────────────────────────────────────────────────────────────────────────────
  // Context
  // ──────────────────────────────────────────────────────────────────────────────
  
  interface NotificationContextValue {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
  }
  
  const NotificationContext = createContext<NotificationContextValue | null>(null);
  
  export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
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
  
  export function NotificationProvider({
    children,
    wsUrl,
    initialNotifications = [],
    maxNotifications = 200,
  }: NotificationProviderProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const serviceRef = useRef<NotificationSocketService | null>(null);
  
    const unreadCount = notifications.filter((n) => !n.read).length;
  
    const addNotification = useCallback(
      (notification: Notification) => {
        setNotifications((prev) => {
          const next = [notification, ...prev];
          return next.slice(0, maxNotifications);
        });
      },
      [maxNotifications]
    );
  
    useEffect(() => {
      const svc = new NotificationSocketService(wsUrl);
      serviceRef.current = svc;
      svc.connect();
  
      const unsubscribe = svc.subscribe(addNotification);
      return () => {
        unsubscribe();
        svc.disconnect();
      };
    }, [wsUrl, addNotification]);
  
    const markAsRead = useCallback((id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      serviceRef.current?.send("notification_read", { id });
    }, []);
  
    const markAllAsRead = useCallback(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      serviceRef.current?.send("notification_read", { all: true });
    }, []);
  
    const clearNotification = useCallback((id: string) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      serviceRef.current?.send("notification_clear", { id });
    }, []);
  
    const clearAll = useCallback(() => {
      setNotifications([]);
      serviceRef.current?.send("notification_clear", { all: true });
    }, []);
  
    return (
      <NotificationContext.Provider
        value={{
          notifications,
          unreadCount,
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