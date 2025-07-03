'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FaCheck, FaCheckDouble } from 'react-icons/fa';
import { useMessagingStore } from '@/store/messagingStore';

export default function MessageThread() {
  const { messages, currentConversation, typingUsers } = useMessagingStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === 'current-user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === 'current-user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100'
              }`}
            >
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />
              {message.attachments?.map((attachment) => (
                <div
                  key={attachment.id}
                  className="mt-2 p-2 bg-white/10 rounded"
                >
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    {attachment.name}
                  </a>
                </div>
              ))}
              <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                <span>
                  {format(new Date(message.timestamp), 'h:mm a')}
                </span>
                {message.senderId === 'current-user' && (
                  message.read ? (
                    <FaCheckDouble className="w-3 h-3" />
                  ) : (
                    <FaCheck className="w-3 h-3" />
                  )
                )}
              </div>
            </div>
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-500">
              {Array.from(typingUsers).join(', ')} typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 