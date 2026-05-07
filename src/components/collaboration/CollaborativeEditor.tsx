'use client';

import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { MessageCircle, CircleDot, Send } from 'lucide-react';
import { useCollaboration, type CollaborationUser } from '../../hooks/useCollaboration';
import { UserPresence } from './UserPresence';

interface CollaborativeEditorProps {
  roomId: string;
  user: CollaborationUser;
  websocketUrl?: string;
}

export function CollaborativeEditor({ roomId, user, websocketUrl }: CollaborativeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [chatDraft, setChatDraft] = useState('');
  const {
    connected,
    status,
    editorText,
    users,
    messages,
    updateText,
    updateCursor,
    sendMessage,
  } = useCollaboration(roomId, user, websocketUrl);

  const activeUserCount = users.length;
  const connectionStatus = connected ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Offline';

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateText(event.target.value);
  };

  const handleSelectionChange = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart } = textarea;
    const preText = textarea.value.slice(0, selectionStart);
    const line = preText.split('\n').length;
    const column = selectionStart - preText.lastIndexOf('\n');
    updateCursor({ line, column });
  };

  const handleSendChat = () => {
    const trimmed = chatDraft.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setChatDraft('');
  };

  const recentMessages = useMemo(
    () => messages.slice(-6).reverse(),
    [messages],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Collaborative editor</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live editing with shared cursors, presence, and integrated chat.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <CircleDot size={14} className={connected ? 'text-emerald-500' : 'text-amber-500'} />
            {connectionStatus}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
                <span>{activeUserCount} collaborators online</span>
                <span>Room: {roomId}</span>
              </div>
              <textarea
                ref={textareaRef}
                value={editorText}
                onChange={handleTextChange}
                onSelect={handleSelectionChange}
                onKeyUp={handleSelectionChange}
                rows={16}
                className="h-full w-full resize-none rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                placeholder="Start collaborating on your lesson notes or group proposal..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {users.map((participant) => (
                <div key={participant.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <img src={participant.avatar} alt={participant.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{participant.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{participant.cursor ? `Cursor line ${participant.cursor.line}` : 'Reading'} • {participant.isSharingScreen ? 'Sharing screen' : 'Editing'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <MessageCircle size={18} /> Chat
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {recentMessages.length ? (
                  recentMessages.map((message) => (
                    <div key={message.id} className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{message.userName}</span>
                        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                      <p className="mt-2 leading-6">{message.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet. Start the conversation to keep your team synced in real time.</p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSendChat();
                    }
                  }}
                  className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                  placeholder="Send a message to your team"
                />
                <button
                  type="button"
                  onClick={handleSendChat}
                  className="inline-flex h-12 items-center justify-center rounded-3xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            <UserPresence users={users} />
          </div>
        </div>
      </div>
    </div>
  );
}
