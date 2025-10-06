'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/app/store/notificationStore';
import NotificationCenter from '@/app/components/notifications/NotificationCenter';

export default function NotificationBell() {
  const { notifications } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white hover:bg-gray-50"
      >
        <Bell size={18} className="text-gray-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] leading-none rounded-full bg-red-600 text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <div className="rounded-md shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
            <NotificationCenter />
          </div>
        </div>
      )}
    </div>
  );
}
