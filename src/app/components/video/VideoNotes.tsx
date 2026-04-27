'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageSquare, Edit2, Trash2, Save } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { formatTime, generateId, getVideoStorageKey } from '@/utils/videoUtils';
import { useVideoPlayerContext } from './VideoPlayerContext';

type PersistedVideoNote = {
  id: string;
  time: number;
  text: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export function VideoNotes() {
  const { lessonId, userId, currentTime, onNote } = useVideoPlayerContext();

  const storageKey = useMemo(
    () => getVideoStorageKey({ kind: 'notes', userId, lessonId }),
    [lessonId, userId],
  );

  const [notes, setNotes] = useState<PersistedVideoNote[]>([]);
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const persistCache = useCallback(
    (next: PersistedVideoNote[]) => {
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
      const parsed = JSON.parse(raw) as PersistedVideoNote[];
      if (Array.isArray(parsed)) setNotes(parsed);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const loadFromApi = useCallback(async () => {
    try {
      const url = `/api/notes?userId=${encodeURIComponent(
        userId ?? '',
      )}&lessonId=${encodeURIComponent(lessonId)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = (await res.json()) as { data: PersistedVideoNote[] };
      if (!json?.data) return;
      setNotes(json.data);
      persistCache(json.data);
    } catch {
      // ignore, keep local cache
    }
  }, [lessonId, persistCache, userId]);

  useEffect(() => {
    loadLocalCache();
    loadFromApi();
  }, [loadFromApi, loadLocalCache]);

  const addNote = useCallback(() => {
    const text = newText.trim();
    if (!text) return;

    const now = new Date().toISOString();
    const note: PersistedVideoNote = {
      id: generateId('note'),
      time: Math.max(0, currentTime),
      text,
      createdAt: now,
      updatedAt: now,
    };

    setNotes((prev) => {
      const next = [note, ...prev];
      persistCache(next);
      return next;
    });

    setNewText('');
    setShowAdd(true);

    // Persist to API (optimistic UI already updated).
    apiClient
      .post('/api/notes', { userId, lessonId, note })
      .then(() => {
        onNote?.({ time: note.time, text: note.text });
      })
      .catch(() => undefined);
  }, [currentTime, lessonId, newText, onNote, persistCache, userId]);

  const startEdit = useCallback(
    (id: string) => {
      const note = notes.find((n) => n.id === id);
      if (!note) return;
      setEditingId(id);
      setEditText(note.text);
    },
    [notes],
  );

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) return;

    const now = new Date().toISOString();
    setNotes((prev) => {
      const next = prev.map((n) => (n.id === editingId ? { ...n, text, updatedAt: now } : n));
      persistCache(next);
      return next;
    });

    apiClient.patch('/api/notes', { userId, lessonId, id: editingId, text }).catch(() => undefined);

    setEditingId(null);
    setEditText('');
  }, [editText, editingId, lessonId, persistCache, userId]);

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        persistCache(next);
        return next;
      });

      // DELETE with JSON payload (apiClient.delete doesn't support request body).
      void fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lessonId, id }),
      }).catch(() => undefined);
    },
    [lessonId, persistCache, userId],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        addNote();
      }
    },
    [addNote],
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-gray-900" />
          <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        </div>
        <button
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          onClick={() => setShowAdd((s) => !s)}
          type="button"
        >
          {showAdd ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
          <Clock size={14} className="text-gray-500" />
          Current time: <span className="font-medium">{formatTime(currentTime)}</span>
        </p>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Note</label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your note here... (Ctrl+Enter to save)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500">{newText.length} characters</span>
                <button
                  onClick={addNote}
                  disabled={!newText.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  type="button"
                >
                  <Save size={14} />
                  Save Note
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No notes yet</p>
            <p className="text-sm">Start taking notes to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Edit note..."
                      title="Edit note"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditText('');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
                        <p className="text-gray-900 mb-2 whitespace-pre-wrap">{note.text}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(note.time)}
                          </span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                          {note.updatedAt !== note.createdAt && (
                            <span className="text-blue-600">(edited)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => startEdit(note.id)}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Edit note"
                          type="button"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete note"
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
        {notes.length} note{notes.length === 1 ? '' : 's'} • Notes are synced to this lesson.
      </div>
    </div>
  );
}
