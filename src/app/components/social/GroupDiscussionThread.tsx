'use client';

import React, { useMemo, useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send } from 'lucide-react';
import RichTextEditor from '@/app/components/ui/RichTextEditor';
import type { GroupMessage, Attachment } from '@/app/hooks/useStudyGroups';
import { formatDistanceToNow } from 'date-fns';

interface GroupDiscussionThreadProps {
  messages: GroupMessage[];
  onPost: (contentHtml: string, attachments?: Attachment[]) => void;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function GroupDiscussionThread({ messages, onPost }: GroupDiscussionThreadProps) {
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorHelpId = useId();

  const attachments = useMemo<Attachment[]>(
    () =>
      files.map((f) => ({
        id: `${f.name}_${f.size}_${f.lastModified}`,
        name: f.name,
        url: URL.createObjectURL(f),
        type: f.type,
      })),
    [files],
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const end = messagesEndRef.current;
    if (typeof end?.scrollIntoView === 'function') {
      end.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handlePost = () => {
    if (!content || content === '<p></p>' || content.trim() === '') return;
    onPost(content, attachments.length ? attachments : undefined);
    setContent('');
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div
        className="flex-1 overflow-y-auto space-y-4 p-4"
        role="log"
        aria-label="Discussion messages"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400" role="status">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((m, index) => (
              <motion.article
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 group"
                aria-labelledby={`message-${m.id}-sender`}
              >
                {/* Avatar */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 border-2 border-white dark:border-gray-700 flex items-center justify-center text-sm font-medium text-purple-600 dark:text-purple-400"
                  aria-hidden="true"
                >
                  {getInitials(m.senderName)}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      id={`message-${m.id}-sender`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-50"
                    >
                      {m.senderName}
                    </span>
                    <time
                      className="text-xs text-gray-500 dark:text-gray-400"
                      dateTime={new Date(m.createdAt).toISOString()}
                    >
                      {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </time>
                  </div>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                    dangerouslySetInnerHTML={{ __html: m.contentHtml }}
                  />
                  {!!m.attachments?.length && (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
                        >
                          <Paperclip size={14} />
                          {a.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50"
        onSubmit={(event) => {
          event.preventDefault();
          handlePost();
        }}
        aria-label="Create discussion post"
      >
        <div onKeyDown={handleEditorKeyDown}>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Share an update..."
            ariaLabel="Discussion post content"
            describedBy={editorHelpId}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <Paperclip size={16} />
            <span>Attach files</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              aria-label="Attach files to discussion post"
              onChange={(e) => {
                const fl = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...fl]);
              }}
            />
          </label>
          <button
            disabled={!content || content === '<p></p>' || content.trim() === ''}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
            type="submit"
          >
            <Send size={16} />
            Post
          </button>
        </div>
        {!!files.length && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {files.length} file(s) ready:
            </span>
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
              >
                {file.name}
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p id={editorHelpId} className="text-xs text-gray-500 dark:text-gray-400">
          Press Cmd/Ctrl + Enter to post
        </p>
      </form>
    </div>
  );
}
