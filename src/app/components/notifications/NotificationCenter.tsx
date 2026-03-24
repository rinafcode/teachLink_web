"use client";

import React from "react";
import { Bell, Check } from "lucide-react";
import { useNotificationStore } from "@/app/store/notificationStore";

export default function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, clearRead } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white border rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Bell size={18} /> Notifications
          {unread > 0 && (
            <span className="ml-1 inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">
              {unread} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllAsRead} className="text-sm text-gray-600 hover:text-gray-900">Mark all read</button>
          <button onClick={clearRead} className="text-sm text-gray-600 hover:text-gray-900">Clear read</button>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.length === 0 && (
          <div className="text-sm text-gray-500">You&apos;re all caught up!</div>
        )}
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-2 p-2 rounded border ${n.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-100'}`}>
            <div className="flex-1">
              <div className="text-sm text-gray-900">{n.message}</div>
              <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {!n.read && (
              <button onClick={() => markAsRead(n.id)} className="text-xs inline-flex items-center gap-1 text-blue-700 hover:underline">
                <Check size={14} /> Read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
