import { DEFAULT_SOCKET_URL } from '@/constants/app.constants';
import { create } from 'zustand';
import type { Socket } from 'socket.io-client';
import { wsManager } from '@/lib/websocketManager';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  attachments?: Attachment[];
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  role: 'student' | 'instructor';
  online: boolean;
  lastSeen?: Date;
}

export interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  socket: Socket | null;
  isConnected: boolean;
  isTyping: boolean;
  typingUsers: Set<string>;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  hasMoreMessages: boolean;
  currentPage: number;
  searchQuery: string;
  selectedFiles: File[];
  uploadingFiles: boolean;

  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  sendMessage: (content: string, attachments?: Attachment[]) => void;
  markMessageAsRead: (messageId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  setTyping: (isTyping: boolean) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  initializeSocket: () => void;
  disconnectSocket: () => void;
  loadMoreMessages: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (index: number) => void;
  uploadAttachments: (files: File[]) => Promise<Attachment[]>;
  createConversation: (participantId: string) => Promise<Conversation | null>;
  getTotalUnreadCount: () => number;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  socket: null,
  isConnected: false,
  isTyping: false,
  typingUsers: new Set(),
  isLoadingMessages: false,
  isLoadingConversations: false,
  hasMoreMessages: false,
  currentPage: 1,
  searchQuery: '',
  selectedFiles: [],
  uploadingFiles: false,

  setConversations: (conversations) => set({ conversations }),

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  sendMessage: (content, attachments) => {
    const state = get();
    if (!state.currentConversation) return;

    const message: Message = {
      id: `${Date.now()}`,
      conversationId: state.currentConversation.id,
      content,
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: '',
      timestamp: new Date(),
      read: false,
      delivered: true,
      attachments,
    };

    get().addMessage(message);

    if (state.socket) {
      state.socket.emit('message', message);
    }

    get().setTyping(false);
  },

  markMessageAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)),
    }));

    get().socket?.emit('read', { messageId });
  },

  markConversationAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
      ),
    }));
  },

  setTyping: (isTyping) => {
    set({ isTyping });

    const socket = get().socket;
    const conversation = get().currentConversation;

    if (socket && conversation) {
      socket.emit('typing', {
        conversationId: conversation.id,
        isTyping,
      });
    }
  },

  addTypingUser: (userId) => {
    set((state) => ({
      typingUsers: new Set([...state.typingUsers, userId]),
    }));
  },

  removeTypingUser: (userId) => {
    set((state) => {
      const updated = new Set(state.typingUsers);
      updated.delete(userId);
      return { typingUsers: updated };
    });
  },

  initializeSocket: () => {
    if (get().socket) return;

    try {
      const socket = wsManager.connect('messaging', {
        url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || DEFAULT_SOCKET_URL,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        heartbeatInterval: 30000,
      });

      socket.on('connect', () => set({ isConnected: true }));
      socket.on('disconnect', () => set({ isConnected: false }));
      socket.on('message', (message: Message) => get().addMessage(message));
      socket.on('typing', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
        if (isTyping) {
          get().addTypingUser(userId);
        } else {
          get().removeTypingUser(userId);
        }
      });
      socket.on('read', ({ messageId }: { messageId: string }) => {
        get().markMessageAsRead(messageId);
      });

      set({ socket });
    } catch {
      set({ isConnected: false });
    }
  },

  disconnectSocket: () => {
    wsManager.disconnect('messaging');
    set({ socket: null, isConnected: false });
  },

  loadMoreMessages: () => {
    const state = get();
    if (!state.hasMoreMessages || state.isLoadingMessages) return;
    set({ isLoadingMessages: true, currentPage: state.currentPage + 1 });
    // Actual pagination logic would fetch messages for currentPage from the server.
    // Stub: mark loading done after a tick until a real fetch layer exists.
    setTimeout(() => set({ isLoadingMessages: false }), 0);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedFiles: (files) => set({ selectedFiles: files }),

  removeSelectedFile: (index) => {
    set((state) => ({
      selectedFiles: state.selectedFiles.filter((_, i) => i !== index),
    }));
  },

  uploadAttachments: async (files) => {
    set({ uploadingFiles: true });
    try {
      // Upload each file and build Attachment records.
      // Real implementation would POST to a media endpoint; this stub creates
      // local object-URL-based records so the types are fully satisfied.
      const attachments: Attachment[] = files.map((file) => ({
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
        size: file.size,
      }));
      return attachments;
    } finally {
      set({ uploadingFiles: false });
    }
  },

  createConversation: async (participantId) => {
    const existing = get().conversations.find((c) =>
      c.participants.some((p) => p.id === participantId),
    );
    if (existing) {
      get().setCurrentConversation(existing);
      return existing;
    }

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants: [
        { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
        { id: participantId, name: participantId, avatar: '', role: 'student', online: false },
      ],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({ conversations: [...state.conversations, newConversation] }));
    get().setCurrentConversation(newConversation);
    return newConversation;
  },

  getTotalUnreadCount: () =>
    get().conversations.reduce((total, conv) => total + conv.unreadCount, 0),
}));
