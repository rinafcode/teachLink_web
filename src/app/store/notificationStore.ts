import { create } from 'zustand';

export type AppNotification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  createdAt: string; // ISO
  read: boolean;
  meta?: Record<string, any>;
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const STORAGE_KEY = 'notifications_v1';

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string }) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: load<AppNotification[]>(STORAGE_KEY, []),
  addNotification: (n) => {
    const notif: AppNotification = {
      id: n.id || `ntf_${Math.random().toString(36).slice(2)}_${Date.now()}`,
      type: n.type,
      message: n.message,
      meta: n.meta,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const next = [notif, ...get().notifications].slice(0, 200);
    set({ notifications: next });
    save(STORAGE_KEY, next);
    return notif;
  },
  markAsRead: (id) => {
    const next = get().notifications.map((x) => (x.id === id ? { ...x, read: true } : x));
    set({ notifications: next });
    save(STORAGE_KEY, next);
  },
  markAllAsRead: () => {
    const next = get().notifications.map((x) => ({ ...x, read: true }));
    set({ notifications: next });
    save(STORAGE_KEY, next);
  },
  clearRead: () => {
    const next = get().notifications.filter((x) => !x.read);
    set({ notifications: next });
    save(STORAGE_KEY, next);
  },
}));