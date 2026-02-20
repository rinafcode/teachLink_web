'use client';

import { useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import {
  FiCheck,
  FiCheckCircle,
  FiFile,
  FiDownload,
  FiImage,
  FiFileText,
  FiChevronUp,
} from 'react-icons/fi';
import type { Message, Attachment } from '@/app/store/messagingStore';

interface MessageThreadProps {
  messages: Message[];
  conversationId: string | null;
  typingText: string;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => void;
  onMarkAsRead: (messageId: string) => void;
  participantName: string;
  participantOnline: boolean;
}

function formatMessageDate(date: Date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <FiImage className="w-4 h-4" />;
  if (type.includes('pdf')) return <FiFileText className="w-4 h-4" />;
  return <FiFile className="w-4 h-4" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ReadReceipt({ message }: { message: Message }) {
  if (message.senderId !== 'current-user') return null;

  return (
    <span className="inline-flex items-center ml-1.5">
      {message.read ? (
        <span className="flex items-center text-blue-400" title="Read">
          <FiCheckCircle className="w-3 h-3" />
        </span>
      ) : message.delivered ? (
        <span className="flex items-center text-gray-300" title="Delivered">
          <FiCheck className="w-3 h-3" />
          <FiCheck className="w-3 h-3 -ml-1.5" />
        </span>
      ) : (
        <span className="flex items-center text-gray-300" title="Sent">
          <FiCheck className="w-3 h-3" />
        </span>
      )}
    </span>
  );
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.type.startsWith('image/');

  return (
    <div className="mt-2 rounded-lg overflow-hidden">
      {isImage ? (
        <div className="relative group">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-[240px] max-h-[180px] rounded-lg object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <a
              href={attachment.url}
              download={attachment.name}
              className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <FiDownload className="w-4 h-4 text-white" />
            </a>
          </div>
        </div>
      ) : (
        <a
          href={attachment.url}
          download={attachment.name}
          className="flex items-center gap-3 p-3 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors group"
        >
          <div className="w-10 h-10 rounded-lg bg-white/20 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
            {getFileIcon(attachment.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachment.name}</p>
            <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
          </div>
          <FiDownload className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </a>
      )}
    </div>
  );
}

function TypingIndicator({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="flex justify-start mb-3 animate-fadeIn">
      <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{text}</span>
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full">
        {formatMessageDate(date)}
      </span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
    </div>
  );
}

export default function MessageThread({
  messages,
  conversationId,
  typingText,
  isLoadingMessages,
  hasMoreMessages,
  onLoadMore,
  onMarkAsRead,
  participantName,
  participantOnline,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  // Mark unread messages as read when visible
  const messageObserverCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const messageId = entry.target.getAttribute('data-message-id');
          if (messageId) {
            onMarkAsRead(messageId);
          }
        }
      });
    },
    [onMarkAsRead]
  );

  useEffect(() => {
    observerRef.current = new IntersectionObserver(messageObserverCallback, {
      threshold: 0.5,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [messageObserverCallback]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Welcome to Messages
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a conversation from the sidebar to start messaging with your instructors and peers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {participantName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          {participantOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {participantName}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {participantOnline ? (
              <span className="text-emerald-500 font-medium">Online</span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Load More Button */}
        {hasMoreMessages && (
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMessages}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 rounded-full hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors disabled:opacity-50"
              id="load-more-messages"
            >
              <FiChevronUp className="w-3 h-3" />
              {isLoadingMessages ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoadingMessages && messages.length === 0 && (
          <div className="space-y-4 py-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-gray-200 dark:bg-gray-700' : 'bg-violet-200 dark:bg-violet-800/50'
                    }`}
                  style={{
                    width: `${150 + Math.random() * 200}px`,
                    height: `${40 + Math.random() * 30}px`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const isOwn = message.senderId === 'current-user';
          const showDateDivider =
            index === 0 ||
            !isSameDay(
              new Date(message.timestamp),
              new Date(messages[index - 1].timestamp)
            );
          const showAvatar =
            !isOwn &&
            (index === messages.length - 1 ||
              messages[index + 1]?.senderId !== message.senderId);

          return (
            <div key={message.id} data-message-id={message.id}>
              {showDateDivider && (
                <DateDivider date={new Date(message.timestamp)} />
              )}
              <div
                className={`flex items-end gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'
                  } animate-fadeIn`}
              >
                {/* Avatar Space */}
                {!isOwn && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                        {message.senderName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md ${isOwn
                      ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                    }`}
                >
                  {/* Message Content */}
                  {message.content && (
                    <div
                      className={`text-sm leading-relaxed break-words ${isOwn
                          ? '[&_p]:text-white [&_strong]:text-white [&_li]:text-white/90 [&_a]:text-violet-200 [&_a]:underline'
                          : '[&_a]:text-violet-600 [&_a]:underline'
                        }`}
                      dangerouslySetInnerHTML={{
                        __html: message.content,
                      }}
                    />
                  )}

                  {/* Attachments */}
                  {message.attachments?.map((attachment) => (
                    <AttachmentPreview key={attachment.id} attachment={attachment} />
                  ))}

                  {/* Timestamp & Read Receipt */}
                  <div
                    className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    <span
                      className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
                        }`}
                    >
                      {format(new Date(message.timestamp), 'h:mm a')}
                    </span>
                    <ReadReceipt message={message} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        <TypingIndicator text={typingText} />

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}