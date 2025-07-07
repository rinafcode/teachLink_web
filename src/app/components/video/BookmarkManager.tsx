import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Clock, Edit2, Trash2, Plus } from 'lucide-react';

interface Bookmark {
  id: string;
  time: number;
  title: string;
  note?: string;
  createdAt: Date;
}

interface BookmarkManagerProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onBookmark?: (bookmark: { time: number; title: string; note?: string }) => void;
}

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  currentTime,
  duration,
  onSeek,
  onBookmark
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [newBookmark, setNewBookmark] = useState({ title: '', note: '' });

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('video-bookmarks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBookmarks(parsed.map((b: any) => ({
          ...b,
          createdAt: new Date(b.createdAt)
        })));
      } catch (error) {
        console.error('Failed to load bookmarks:', error);
      }
    }
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('video-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const addBookmark = () => {
    if (!newBookmark.title.trim()) return;

    const bookmark: Bookmark = {
      id: Date.now().toString(),
      time: currentTime,
      title: newBookmark.title.trim(),
      note: newBookmark.note.trim() || undefined,
      createdAt: new Date()
    };

    setBookmarks(prev => [bookmark, ...prev]);
    setNewBookmark({ title: '', note: '' });
    setShowAddForm(false);

    if (onBookmark) {
      onBookmark({
        time: bookmark.time,
        title: bookmark.title,
        note: bookmark.note
      });
    }
  };

  const updateBookmark = (id: string, updates: Partial<Bookmark>) => {
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates } : b
    ));
    setEditingBookmark(null);
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Bookmarks</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Add Bookmark Form */}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newBookmark.title}
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
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
                  onChange={(e) => setNewBookmark(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Time: {formatTime(currentTime)}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewBookmark({ title: '', note: '' });
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addBookmark}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bookmark size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No bookmarks yet</p>
            <p className="text-sm">Click the + button to add your first bookmark</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {bookmarks.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editingBookmark === bookmark.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={bookmark.title}
                      onChange={(e) => updateBookmark(bookmark.id, { title: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <textarea
                      value={bookmark.note || ''}
                      onChange={(e) => updateBookmark(bookmark.id, { note: e.target.value })}
                      placeholder="Add a note..."
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingBookmark(null)}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setEditingBookmark(null)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{bookmark.title}</h4>
                        {bookmark.note && (
                          <p className="text-sm text-gray-600 mb-2">{bookmark.note}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTime(bookmark.time)}
                          </span>
                          <span>{formatDate(bookmark.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => onSeek(bookmark.time)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Go to bookmark"
                        >
                          <Bookmark size={14} />
                        </button>
                        <button
                          onClick={() => setEditingBookmark(bookmark.id)}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Edit bookmark"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteBookmark(bookmark.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete bookmark"
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
    </div>
  );
}; 