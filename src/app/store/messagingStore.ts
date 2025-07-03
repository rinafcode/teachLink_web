import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar: string;
  }[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessagingState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  socket: Socket | null;
  isTyping: boolean;
  typingUsers: Set<string>;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  markMessageAsRead: (messageId: string) => void;
  setTyping: (isTyping: boolean) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  initializeSocket: () => void;
  disconnectSocket: () => void;
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  socket: null,
  isTyping: false,
  typingUsers: new Set(),

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      conversations: state.conversations.map((conv) =>
        conv.id === message.senderId || conv.id === message.receiverId
          ? { ...conv, lastMessage: message }
          : conv
      ),
    }));
  },

  markMessageAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      ),
    }));
  },

  setTyping: (isTyping) => {
    set({ isTyping });
    const socket = get().socket;
    if (socket && get().currentConversation) {
      socket.emit('typing', {
        conversationId: get().currentConversation.id,
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
      const newTypingUsers = new Set(state.typingUsers);
      newTypingUsers.delete(userId);
      return { typingUsers: newTypingUsers };
    });
  },

  initializeSocket: () => {
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    socket.on('message', (message: Message) => {
      get().addMessage(message);
    });

    socket.on('typing', ({ userId, isTyping }) => {
      if (isTyping) {
        get().addTypingUser(userId);
      } else {
        get().removeTypingUser(userId);
      }
    });

    socket.on('read', ({ messageId }) => {
      get().markMessageAsRead(messageId);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
})); 