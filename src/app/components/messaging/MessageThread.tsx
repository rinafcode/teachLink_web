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
  if (type.startsWith('image/')) return <FiImage className="h-4 w-4" />;
  if (type.includes('pdf')) return <FiFileText className="h-4 w-4" />;
  return <FiFile className="h-4 w-4" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ReadReceipt({ message }: { message: Message }) {
  if (message.senderId !== 'current-user') return null;

  return (
    <span className="ml-1.5 inline-flex items-center">
      {message.read ? (
        <span className="flex items-center text-blue-400" title="Read">
          <FiCheckCircle className="h-3 w-3" />
        </span>
      ) : message.delivered ? (
        <span className="flex items-center text-gray-300" title="Delivered">
          <FiCheck className="h-3 w-3" />
          <FiCheck className="-ml-1.5 h-3 w-3" />
        </span>
      ) : (
        <span className="flex items-center text-gray-300" title="Sent">
          <FiCheck className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.type.startsWith('image/');

  return (
    <div className="mt-2 overflow-hidden rounded-lg">
      {isImage ? (
        <div className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-h-[180px] max-w-[240px] rounded-lg object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <a
              href={attachment.url}
              download={attachment.name}
              className="rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <FiDownload className="h-4 w-4 text-white" />
            </a>
          </div>
        </div>
      ) : (
        <a
          href={attachment.url}
          download={attachment.name}
          className="group flex items-center gap-3 rounded-lg bg-white/10 p-3 transition-colors hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 dark:bg-white/10">
            {getFileIcon(attachment.type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{attachment.name}</p>
            <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
          </div>
          <FiDownload className="h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      )}
    </div>
  );
}

function TypingIndicator({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="mb-3 flex justify-start animate-fadeIn">
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-gray-400 dark:bg-gray-500"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">{text}</span>
        </div>
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: Date }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-400 dark:bg-gray-800/50 dark:text-gray-500">
        {formatMessageDate(date)}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

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
    [onMarkAsRead],
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
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20">
            <svg
              className="h-12 w-12 text-violet-500"
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
          <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Welcome to Messages
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a conversation from the sidebar to start messaging with your instructors and
            peers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-semibold text-white">
            {participantName
              .split(' ')
              .map((name) => name[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          {participantOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400 dark:border-gray-900" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{participantName}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {participantOnline ? (
              <span className="font-medium text-emerald-500">Online</span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 space-y-1 overflow-y-auto px-6 py-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {hasMoreMessages && (
          <div className="flex justify-center py-3">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMessages}
              className="flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100 disabled:opacity-50 dark:bg-violet-950/30 dark:text-violet-400 dark:hover:bg-violet-950/50"
              id="load-more-messages"
            >
              <FiChevronUp className="h-3 w-3" />
              {isLoadingMessages ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {isLoadingMessages && messages.length === 0 && (
          <div className="space-y-4 py-4">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`animate-pulse rounded-2xl ${
                    index % 2 === 0
                      ? 'bg-gray-200 dark:bg-gray-700'
                      : 'bg-violet-200 dark:bg-violet-800/50'
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

        {messages.map((message, index) => {
          const isOwn = message.senderId === 'current-user';
          const previousMessage = messages[index - 1];
          const nextMessage = messages[index + 1];
          const showDateDivider =
            index === 0 ||
            !previousMessage ||
            !isSameDay(new Date(message.timestamp), new Date(previousMessage.timestamp));
          const showAvatar = !isOwn && (!nextMessage || nextMessage.senderId !== message.senderId);

          return (
            <div key={message.id} data-message-id={message.id}>
              {showDateDivider && <DateDivider date={new Date(message.timestamp)} />}
              <div
                className={`mb-1 flex items-end gap-2 animate-fadeIn ${
                  isOwn ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isOwn && (
                  <div className="w-8 flex-shrink-0">
                    {showAvatar && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-semibold text-white">
                        {message.senderName
                          .split(' ')
                          .map((name) => name[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md ${
                    isOwn
                      ? 'rounded-br-md bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                      : 'rounded-bl-md bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {message.content && (
                    <div
                      className={`break-words text-sm leading-relaxed ${
                        isOwn
                          ? '[&_a]:text-violet-200 [&_a]:underline [&_li]:text-white/90 [&_p]:text-white [&_strong]:text-white'
                          : '[&_a]:text-violet-600 [&_a]:underline'
                      }`}
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  )}

                  {message.attachments?.map((attachment) => (
                    <AttachmentPreview key={attachment.id} attachment={attachment} />
                  ))}

                  <div
                    className={`mt-1 flex items-center gap-1 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span
                      className={`text-[10px] ${
                        isOwn ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'
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

        <TypingIndicator text={typingText} />

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
