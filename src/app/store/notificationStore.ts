import { create } from 'zustand';
import { AppNotification } from '@/lib/notifications/types';
import { NotificationService } from '@/lib/notifications/service';

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
  addNotification: (
    n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string },
  ) => AppNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: load<AppNotification[]>(STORAGE_KEY, []),
  addNotification: (n) => {
    const notif = NotificationService.createNotification({
      message: n.message,
      type: n.type,
      meta: n.meta,
    });
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
  removeNotification: (id) => {
    const next = get().notifications.filter((x) => x.id !== id);
    set({ notifications: next });
    save(STORAGE_KEY, next);
  },
  clearRead: () => {
    const next = get().notifications.filter((x) => !x.read);
    set({ notifications: next });
    save(STORAGE_KEY, next);
  },
}));
