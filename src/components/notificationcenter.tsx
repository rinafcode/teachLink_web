import React, { useState, useRef, useEffect } from 'react';
import { BellOff } from 'lucide-react';
import { Notification, NotificationType, useNotifications } from '@/providers/Notificationprovider';
import { EmptyState } from '@/components';
import Image from 'next/image';

// ──────────────────────────────────────────────────────────────────────────────
// Icon helpers
// ──────────────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<NotificationType, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  message: '💬',
  course: '📚',
  system: '🔔',
};

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ──────────────────────────────────────────────────────────────────────────────
// NotificationItem
// ──────────────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClear: (id: string) => void;
}

function NotificationItem({ notification, onRead, onClear }: NotificationItemProps) {
  const { id, type, title, body, timestamp, read, actionUrl, avatarUrl } = notification;

  function handleClick() {
    if (!read) onRead(id);
    if (actionUrl) window.location.href = actionUrl;
  }

  return (
    <div
      className={`notification-item ${
        read ? 'notification-item--read' : 'notification-item--unread'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="notification-item__icon">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            className="notification-item__avatar"
            width={40}
            height={40}
          />
        ) : (
          <span aria-hidden="true">{TYPE_ICON[type]}</span>
        )}
      </div>
      <div className="notification-item__body">
        <p className="notification-item__title">{title}</p>
        {body && <p className="notification-item__text">{body}</p>}
        <time className="notification-item__time" dateTime={timestamp.toISOString()}>
          {timeAgo(timestamp)}
        </time>
      </div>
      {!read && <span className="notification-item__dot" aria-label="Unread" />}
      <button
        className="notification-item__clear"
        onClick={(e) => {
          e.stopPropagation();
          onClear(id);
        }}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NotificationBadge
// ──────────────────────────────────────────────────────────────────────────────

interface NotificationBadgeProps {
  count: number;
  onClick: () => void;
}

export function NotificationBadge({ count, onClick }: NotificationBadgeProps) {
  return (
    <button
      className="notification-badge-btn"
      onClick={onClick}
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
    >
      <span className="notification-bell" aria-hidden="true">
        🔔
      </span>
      {count > 0 && <span className="notification-count">{count > 99 ? '99+' : count}</span>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// NotificationCenter (dropdown panel)
// ──────────────────────────────────────────────────────────────────────────────

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } =
    useNotifications();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Mark visible unread as read after 3 s when panel is open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => markAllAsRead(), 3000);
    return () => clearTimeout(timer);
  }, [open, markAllAsRead]);

  return (
    <div className="notification-center" ref={panelRef}>
      <NotificationBadge count={unreadCount} onClick={() => setOpen((v) => !v)} />

      {open && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-panel__header">
            <h2>Notifications</h2>
            <div className="notification-panel__actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn-link">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="btn-link btn-link--danger">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notification-panel__list">
            {notifications.length === 0 ? (
              <EmptyState icon={BellOff} title="You're all caught up!" className="py-8" />
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onClear={clearNotification}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
