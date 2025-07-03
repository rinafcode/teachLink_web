'use client';

import { useEffect } from 'react';
import ConversationList from '@/components/messaging/ConversationList';
import MessageThread from '@/components/messaging/MessageThread';
import MessageComposer from '@/components/messaging/MessageComposer';
import { useMessagingStore } from '@/store/messagingStore';

export default function MessagesPage() {
  const { initializeSocket, disconnectSocket } = useMessagingStore();

  useEffect(() => {
    initializeSocket();
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket]);

  return (
    <div className="h-screen flex">
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col bg-gray-50">
        <MessageThread />
        <MessageComposer />
      </div>
    </div>
  );
} 