'use client';

import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useMessagingStore } from '@/app/store/messagingStore';
import type { Attachment } from '@/app/store/messagingStore';

export function useMessaging() {
  const {
    conversations,
    currentConversation,
    messages,
    isConnected,
    isTyping,
    typingUsers,
    isLoadingMessages,
    isLoadingConversations,
    hasMoreMessages,
    searchQuery,
    selectedFiles,
    uploadingFiles,
    setCurrentConversation,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    setTyping,
    initializeSocket,
    disconnectSocket,
    loadMoreMessages,
    setSearchQuery,
    setSelectedFiles,
    removeSelectedFile,
    uploadAttachments,
    createConversation,
    getTotalUnreadCount,
  } = useMessagingStore();

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize socket on mount; clean up on unmount
  useEffect(() => {
    initializeSocket();
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket]);

  // Handle typing indicator with debounce
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [isTyping, setTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping(false);
  }, [setTyping]);

  // Send message with optional file attachments
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() && selectedFiles.length === 0) return;

      let attachments: Attachment[] | undefined;

      if (selectedFiles.length > 0) {
        attachments = await uploadAttachments(selectedFiles);
      }

      sendMessage(content, attachments);
      handleTypingStop();
    },
    [selectedFiles, uploadAttachments, sendMessage, handleTypingStop],
  );

  // Select a conversation by id
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      }
    },
    [conversations, setCurrentConversation],
  );

  // Handle file selection with 10 MB size guard
  const handleFileSelect = useCallback(
    (files: FileList) => {
      const fileArray = Array.from(files);
      const maxSize = 10 * 1024 * 1024; // 10 MB
      const rejectedFiles = fileArray.filter((file) => file.size > maxSize);

      if (rejectedFiles.length > 0) {
        const names = rejectedFiles.map((f) => f.name).join(', ');
        toast.error(
          `Skipped ${rejectedFiles.length} file(s): ${names}. Max file size is 10 MB.`,
        );
      }

      const validFiles = fileArray.filter((file) => file.size <= maxSize);
      setSelectedFiles([...selectedFiles, ...validFiles]);
    },
    [selectedFiles, setSelectedFiles],
  );

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return conv.participants.some(
      (p) => p.id !== 'current-user' && p.name.toLowerCase().includes(query),
    );
  });

  // Return the other participant in a one-to-one conversation
  const getOtherParticipant = useCallback(
    (conversationId: string) => {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (!conversation) return null;
      return conversation.participants.find((p) => p.id !== 'current-user') ?? null;
    },
    [conversations],
  );

  // Build a human-readable typing indicator string for the current conversation
  const getTypingUserNames = useCallback((): string => {
    if (!currentConversation || typingUsers.size === 0) return '';

    const names = Array.from(typingUsers)
      .map((userId) => {
        const participant = currentConversation.participants.find((p) => p.id === userId);
        return participant?.name ?? 'Someone';
      })
      .join(', ');

    return typingUsers.size === 1 ? `${names} is typing...` : `${names} are typing...`;
  }, [currentConversation, typingUsers]);

  return {
    // State
    conversations: filteredConversations,
    allConversations: conversations,
    currentConversation,
    messages,
    isConnected,
    isTyping,
    typingUsers,
    isLoadingMessages,
    isLoadingConversations,
    hasMoreMessages,
    searchQuery,
    selectedFiles,
    uploadingFiles,
    totalUnreadCount: getTotalUnreadCount(),

    // Actions
    handleSelectConversation,
    handleSendMessage,
    handleTypingStart,
    handleTypingStop,
    handleFileSelect,
    loadMoreMessages,
    setSearchQuery,
    removeSelectedFile,
    createConversation,
    markMessageAsRead,
    markConversationAsRead,
    getOtherParticipant,
    getTypingUserNames,
  };
}
