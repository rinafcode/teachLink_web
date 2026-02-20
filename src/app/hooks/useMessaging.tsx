'use client';

import { useCallback, useEffect, useRef } from 'react';
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

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize socket on mount
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

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 2 seconds of inactivity
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
        [selectedFiles, uploadAttachments, sendMessage, handleTypingStop]
    );

    // Select a conversation
    const handleSelectConversation = useCallback(
        (conversationId: string) => {
            const conversation = conversations.find((c) => c.id === conversationId);
            if (conversation) {
                setCurrentConversation(conversation);
            }
        },
        [conversations, setCurrentConversation]
    );

    // Handle file selection
    const handleFileSelect = useCallback(
        (files: FileList) => {
            const fileArray = Array.from(files);
            const maxSize = 10 * 1024 * 1024; // 10MB limit
            const validFiles = fileArray.filter((file) => file.size <= maxSize);
            setSelectedFiles([...selectedFiles, ...validFiles]);
        },
        [selectedFiles, setSelectedFiles]
    );

    // Filter conversations based on search query
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return conv.participants.some(
            (p) => p.id !== 'current-user' && p.name.toLowerCase().includes(query)
        );
    });

    // Get the other participant in a conversation
    const getOtherParticipant = useCallback(
        (conversationId: string) => {
            const conversation = conversations.find((c) => c.id === conversationId);
            if (!conversation) return null;
            return conversation.participants.find((p) => p.id !== 'current-user') || null;
        },
        [conversations]
    );

    // Get typing user names for current conversation
    const getTypingUserNames = useCallback(() => {
        if (!currentConversation || typingUsers.size === 0) return '';

        const names = Array.from(typingUsers)
            .map((userId) => {
                const participant = currentConversation.participants.find(
                    (p) => p.id === userId
                );
                return participant?.name || 'Someone';
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
