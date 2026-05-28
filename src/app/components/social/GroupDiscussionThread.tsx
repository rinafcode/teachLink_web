'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Send } from 'lucide-react';
import RichTextEditor from '@/app/components/ui/RichTextEditor';
import type { GroupMessage, Attachment } from '@/app/hooks/useStudyGroups';
import {
  buildAccessibleThreadTree,
  getThreadPositionLabel,
  type ThreadNode,
} from '@/lib/accessibility/threadSupport';
import { formatDistanceToNow } from 'date-fns';

interface GroupDiscussionThreadProps {
  messages: GroupMessage[];
  onPost: (contentHtml: string, attachments?: Attachment[], parentId?: string | null) => void;
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
  const [replyTo, setReplyTo] = useState<GroupMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const threadedMessages = useMemo(() => buildAccessibleThreadTree(messages), [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handlePost = () => {
    if (!content || content === '<p></p>' || content.trim() === '') return;
    onPost(content, attachments.length ? attachments : undefined, replyTo?.id ?? null);
    setContent('');
    setFiles([]);
    setReplyTo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderMessageNode = (node: ThreadNode<GroupMessage>, index: number) => {
    const m = node.item;
    const replyCount = node.replies.length;
    const indent = Math.min(node.depth, 4) * 1.25;

    return (
      <motion.div
        key={m.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="group"
        role="listitem"
        aria-label={`${getThreadPositionLabel(node.depth, replyCount)} by ${m.senderName}`}
        style={{ marginLeft: `${indent}rem` }}
      >
        <article className="flex items-start gap-3">
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
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {m.senderName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
              </span>
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
                    <Paperclip size={14} aria-hidden="true" />
                    {a.name}
                  </a>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setReplyTo(m)}
              className="mt-2 text-xs font-medium text-purple-700 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:text-purple-300 dark:hover:text-purple-100"
              aria-label={`Reply to ${m.senderName}`}
            >
              Reply
            </button>
          </div>
        </article>
        {node.replies.length > 0 ? (
          <div className="mt-4 space-y-4" role="list" aria-label={`Replies to ${m.senderName}`}>
            {node.replies.map((reply, replyIndex) => renderMessageNode(reply, replyIndex))}
          </div>
        ) : null}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence>
            <div role="list" aria-label="Discussion thread messages" className="space-y-4">
              {threadedMessages.map((node, index) => renderMessageNode(node, index))}
            </div>
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
        {replyTo ? (
          <div className="flex items-center justify-between rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-900 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-100">
            <span>Replying to {replyTo.senderName}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="font-medium underline-offset-2 hover:underline"
            >
              Cancel reply
            </button>
          </div>
        ) : null}
        <RichTextEditor content={content} onChange={setContent} placeholder="Share an update..." />
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <Paperclip size={16} />
            <span>Attach files</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                const fl = Array.from(e.target.files || []);
                setFiles((prev) => [...prev, ...fl]);
              }}
            />
          </label>
          <button
            onClick={handlePost}
            disabled={!content || content === '<p></p>' || content.trim() === ''}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
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
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="hover:text-purple-900 dark:hover:text-purple-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">Press Cmd/Ctrl + Enter to post</p>
      </div>
    </div>
  );
}
