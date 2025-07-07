import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Edit2, Trash2, Save } from 'lucide-react';

interface Note {
  id: string;
  time: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesTakerProps {
  currentTime: number;
  onNote?: (note: { time: number; text: string }) => void;
}

export const NotesTaker: React.FC<NotesTakerProps> = ({
  currentTime,
  onNote
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('video-notes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt)
        })));
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('video-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      time: currentTime,
      text: newNote.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotes(prev => [note, ...prev]);
    setNewNote('');

    if (onNote) {
      onNote({
        time: note.time,
        text: note.text
      });
    }
  };

  const updateNote = (id: string) => {
    if (!editText.trim()) return;

    setNotes(prev => prev.map(n => 
      n.id === id 
        ? { ...n, text: editText.trim(), updatedAt: new Date() }
        : n
    ));
    setEditingNote(null);
    setEditText('');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      addNote();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        <p className="text-sm text-gray-600 mt-1">
          Current time: {formatTime(currentTime)}
        </p>
      </div>

      {/* Add Note Form */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Note
            </label>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your note here... (Ctrl+Enter to save)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {newNote.length} characters
            </span>
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save size={14} />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No notes yet</p>
            <p className="text-sm">Start taking notes to see them here</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {editingNote === note.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingNote(null);
                          setEditText('');
                        }}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => updateNote(note.id)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900 mb-2 whitespace-pre-wrap">{note.text}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Clock size={12} className="mr-1" />
                            {formatTime(note.time)}
                          </span>
                          <span>{formatDate(note.createdAt)}</span>
                          {note.updatedAt > note.createdAt && (
                            <span className="text-blue-600">(edited)</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={() => {
                            setEditingNote(note.id);
                            setEditText(note.text);
                          }}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Edit note"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete note"
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

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{notes.length} notes</span>
          <span>Notes are saved automatically</span>
        </div>
      </div>
    </div>
  );
}; 