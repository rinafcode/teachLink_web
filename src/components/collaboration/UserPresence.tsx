'use client';

import { User, Monitor, MessageSquare } from 'lucide-react';
import type { CollaborationUser } from '../../hooks/useCollaboration';

interface UserPresenceProps {
  users: CollaborationUser[];
  title?: string;
}

export function UserPresence({ users, title = 'Active collaborators' }: UserPresenceProps) {
  if (!users.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-700 dark:bg-slate-900/80">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No one is online in this room yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white/80 p-4 shadow-sm dark:border-gray-700 dark:bg-slate-900/80">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
        <span>{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {users.length} online
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="truncate font-medium">{user.name}</div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                {user.cursor ? <span>Cursor line {user.cursor.line}</span> : <span>Watching</span>}
                {user.isSharingScreen && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-200">
                    <Monitor size={12} /> Screen sharing
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                  <User size={12} /> Active
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
