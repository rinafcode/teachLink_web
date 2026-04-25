'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Clock, Edit2, Trash2, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatTime, generateId, getVideoStorageKey } from '@/utils/videoUtils';
import { useVideoPlayerContext } from './VideoPlayerContext';

type PersistedVideoBookmark = {
  id: string;
  time: number;
  title: string;
  note?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export function VideoBookmarks() {
  const {
    lessonId,
    userId,
    currentTime,
    duration,
    seekToLearning: onSeek,
    onBookmark,
  } = useVideoPlayerContext();

  const storageKey = useMemo(
    () => getVideoStorageKey({ kind: 'bookmarks', userId, lessonId }),
    [lessonId, userId],
  );

  const [bookmarks, setBookmarks] = useState<PersistedVideoBookmark[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newBookmark, setNewBookmark] = useState({ title: '', note: '' });
  const [editForm, setEditForm] = useState({ title: '', note: '' });

  const persistCache = useCallback(
    (next: PersistedVideoBookmark[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  const loadLocalCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedVideoBookmark[];
      if (Array.isArray(parsed)) setBookmarks(parsed);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const loadFromApi = useCallback(async () => {
    try {
      const url = `/api/bookmarks?userId=${encodeURIComponent(
        userId ?? '',
      )}&lessonId=${encodeURIComponent(lessonId)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = (await res.json()) as { data: PersistedVideoBookmark[] };
      if (!json?.data) return;
      setBookmarks(json.data);
      persistCache(json.data);
    } catch {
      // keep local cache
    }
  }, [lessonId, persistCache, userId]);

  useEffect(() => {
    loadLocalCache();
    loadFromApi();
  }, [loadFromApi, loadLocalCache]);

  const addBookmark = useCallback(() => {
    const title = newBookmark.title.trim();
    if (!title) return;

    const now = new Date().toISOString();
    const bookmark: PersistedVideoBookmark = {
      id: generateId('bookmark'),
      time: Math.max(0, currentTime),
      title,
      note: newBookmark.note.trim() ? newBookmark.note.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    setBookmarks((prev) => {
      const next = [bookmark, ...prev];
      persistCache(next);
      return next;
    });

    setNewBookmark({ title: '', note: '' });
    setShowAddForm(false);

    apiClient
      .post('/api/bookmarks', { userId, lessonId, bookmark })
      .then(() => onBookmark?.({ time: bookmark.time, title: bookmark.title, note: bookmark.note }))
      .catch(() => undefined);
  }, [
    currentTime,
    lessonId,
    newBookmark.note,
    newBookmark.title,
    onBookmark,
    persistCache,
    userId,
  ]);

  const startEdit = useCallback(
    (id: string) => {
      const b = bookmarks.find((x) => x.id === id);
      if (!b) return;
      setEditingId(id);
      setEditForm({ title: b.title, note: b.note ?? '' });
    },
    [bookmarks],
  );

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const title = editForm.title.trim();
    if (!title) return;

    const now = new Date().toISOString();
    setBookmarks((prev) => {
      const next = prev.map((b) =>
        b.id === editingId
          ? {
              ...b,
              title,
              note: editForm.note.trim() ? editForm.note.trim() : undefined,
              updatedAt: now,
            }
          : b,
      );
      persistCache(next);
      return next;
    });

    apiClient
      .patch('/api/bookmarks', {
        userId,
        lessonId,
        id: editingId,
        title,
        note: editForm.note.trim() ? editForm.note.trim() : undefined,
      })
      .catch(() => undefined);

    setEditingId(null);
    setEditForm({ title: '', note: '' });
  }, [editForm.note, editForm.title, editingId, lessonId, persistCache, userId]);

  const deleteBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persistCache(next);
        return next;
      });

      void fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId, id }),
      }).catch(() => undefined);
    },
    [lessonId, persistCache, userId],
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Bookmarks</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            type="button"
            aria-label="Add bookmark"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Current time: {formatTime(currentTime)}{' '}
          {duration > 0 ? `• Duration: ${formatTime(duration)}` : null}
        </p>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border-b border-gray-200 bg-gray-50"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Bookmark title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optional)
                </label>
                <textarea
                  value={newBookmark.note}
                  onChange={(e) => setNewBookmark((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Time: <span className="font-medium">{formatTime(currentTime)}</span>
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewBookmark({ title: '', note: '' });
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addBookmark}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    type="button"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4">
        {bookmarks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bookmark size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No bookmarks yet</p>
            <p className="text-sm">Click + to add your first bookmark</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editingId === bookmark.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Bookmark title"
                      title="Bookmark title"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      value={editForm.note}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, note: e.target.value }))}
                      placeholder="Add a note..."
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({ title: '', note: '' });
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800"
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        className="text-xs text-blue-600 hover:text-blue-800"
                        type="button"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">{bookmark.title}</h4>
                        {bookmark.note ? (
                          <p className="text-sm text-gray-600 mb-2">{bookmark.note}</p>
                        ) : null}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(bookmark.time)}
                          </span>
                          <span>{new Date(bookmark.createdAt).toLocaleDateString('en-US')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onSeek(bookmark.time)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Go to bookmark"
                          type="button"
                        >
                          <Bookmark size={14} />
                        </button>
                        <button
                          onClick={() => startEdit(bookmark.id)}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Edit bookmark"
                          type="button"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteBookmark(bookmark.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete bookmark"
                          type="button"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        {bookmarks.length} bookmark{bookmarks.length === 1 ? '' : 's'} • Synced to this lesson.
      </div>
    </div>
  );
}
