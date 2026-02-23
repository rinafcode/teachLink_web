import { create } from 'zustand';
import io from 'socket.io-client';

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
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  socket: ReturnType<typeof io> | null;
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

  // Actions
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
  loadConversations: () => void;
  loadMessages: (conversationId: string, page?: number) => void;
  loadMoreMessages: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedFiles: (files: File[]) => void;
  removeSelectedFile: (index: number) => void;
  uploadAttachments: (files: File[]) => Promise<Attachment[]>;
  createConversation: (participantId: string) => void;
  getTotalUnreadCount: () => number;
}

// Mock data for demonstration
const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: 'instructor-1',
    name: 'Dr. Sarah Chen',
    avatar: '',
    role: 'instructor',
    online: true,
  },
  {
    id: 'instructor-2',
    name: 'Prof. James Wilson',
    avatar: '',
    role: 'instructor',
    online: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
  {
    id: 'student-1',
    name: 'Alex Johnson',
    avatar: '',
    role: 'student',
    online: true,
  },
  {
    id: 'student-2',
    name: 'Maria Garcia',
    avatar: '',
    role: 'student',
    online: false,
    lastSeen: new Date(Date.now() - 7200000),
  },
  {
    id: 'instructor-3',
    name: 'Dr. Emily Park',
    avatar: '',
    role: 'instructor',
    online: true,
  },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
      MOCK_PARTICIPANTS[0],
    ],
    lastMessage: {
      id: 'msg-1',
      conversationId: 'conv-1',
      content: 'Great question! Let me explain the concept in more detail...',
      senderId: 'instructor-1',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 300000),
      read: false,
      delivered: true,
    },
    unreadCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 7),
    updatedAt: new Date(Date.now() - 300000),
  },
  {
    id: 'conv-2',
    participants: [
      { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
      MOCK_PARTICIPANTS[1],
    ],
    lastMessage: {
      id: 'msg-2',
      conversationId: 'conv-2',
      content: 'Your assignment submission looks good. I have a few suggestions...',
      senderId: 'instructor-2',
      senderName: 'Prof. James Wilson',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      delivered: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 14),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'conv-3',
    participants: [
      { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
      MOCK_PARTICIPANTS[2],
    ],
    lastMessage: {
      id: 'msg-3',
      conversationId: 'conv-3',
      content: 'Hey, want to form a study group for the upcoming exam?',
      senderId: 'student-1',
      senderName: 'Alex Johnson',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      delivered: true,
    },
    unreadCount: 1,
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'conv-4',
    participants: [
      { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
      MOCK_PARTICIPANTS[3],
    ],
    lastMessage: {
      id: 'msg-4',
      conversationId: 'conv-4',
      content: 'Thanks for sharing those notes! Really helpful 📚',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'student-2',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      delivered: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'conv-5',
    participants: [
      { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
      MOCK_PARTICIPANTS[4],
    ],
    lastMessage: {
      id: 'msg-5',
      conversationId: 'conv-5',
      content: 'Office hours are available Tuesday 2-4pm if you need help.',
      senderId: 'instructor-3',
      senderName: 'Dr. Emily Park',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 86400000 * 2),
      read: true,
      delivered: true,
    },
    unreadCount: 0,
    createdAt: new Date(Date.now() - 86400000 * 10),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      content: 'Hi Dr. Chen, I had a question about the machine learning assignment.',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'instructor-1',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-1-2',
      conversationId: 'conv-1',
      content: 'Of course! What specifically are you having trouble with?',
      senderId: 'instructor-1',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 3000000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-1-3',
      conversationId: 'conv-1',
      content: 'I\'m confused about the difference between supervised and unsupervised learning in the context of our project. The instructions mention using both approaches but I\'m not sure when to apply each one.',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'instructor-1',
      timestamp: new Date(Date.now() - 2400000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-1-4',
      conversationId: 'conv-1',
      content: '<p>Great question! Here\'s a quick breakdown:</p><ul><li><strong>Supervised learning</strong>: Use this when you have labeled data. For our project, this applies to the classification task.</li><li><strong>Unsupervised learning</strong>: Use this for the clustering portion where we don\'t have predefined categories.</li></ul><p>Does that help clarify things?</p>',
      senderId: 'instructor-1',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 1800000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-1-5',
      conversationId: 'conv-1',
      content: 'Yes! That makes much more sense now. One more thing - for the evaluation metrics, should we use accuracy or F1 score?',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'instructor-1',
      timestamp: new Date(Date.now() - 600000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-1-6',
      conversationId: 'conv-1',
      content: 'Great question! Let me explain the concept in more detail...',
      senderId: 'instructor-1',
      senderName: 'Dr. Sarah Chen',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 300000),
      read: false,
      delivered: true,
    },
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      content: 'Prof. Wilson, I\'ve submitted my assignment. Could you take a look when you have time?',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'instructor-2',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-2-2',
      conversationId: 'conv-2',
      content: 'Your assignment submission looks good. I have a few suggestions for improvement in the methodology section.',
      senderId: 'instructor-2',
      senderName: 'Prof. James Wilson',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      delivered: true,
    },
  ],
  'conv-3': [
    {
      id: 'msg-3-1',
      conversationId: 'conv-3',
      content: 'Hey, want to form a study group for the upcoming exam?',
      senderId: 'student-1',
      senderName: 'Alex Johnson',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      delivered: true,
    },
  ],
  'conv-4': [
    {
      id: 'msg-4-1',
      conversationId: 'conv-4',
      content: 'Hi Maria! Do you have the notes from last week\'s lecture?',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'student-2',
      timestamp: new Date(Date.now() - 172800000),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-4-2',
      conversationId: 'conv-4',
      content: 'Sure! Here are the notes I took. Let me know if you need anything else.',
      senderId: 'student-2',
      senderName: 'Maria Garcia',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 129600000),
      read: true,
      delivered: true,
      attachments: [
        {
          id: 'att-1',
          name: 'lecture_notes_week5.pdf',
          url: '#',
          type: 'application/pdf',
          size: 2457600,
        },
      ],
    },
    {
      id: 'msg-4-3',
      conversationId: 'conv-4',
      content: 'Thanks for sharing those notes! Really helpful 📚',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'student-2',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      delivered: true,
    },
  ],
  'conv-5': [
    {
      id: 'msg-5-1',
      conversationId: 'conv-5',
      content: 'Dr. Park, when are your office hours this week?',
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: 'instructor-3',
      timestamp: new Date(Date.now() - 86400000 * 3),
      read: true,
      delivered: true,
    },
    {
      id: 'msg-5-2',
      conversationId: 'conv-5',
      content: 'Office hours are available Tuesday 2-4pm if you need help.',
      senderId: 'instructor-3',
      senderName: 'Dr. Emily Park',
      senderAvatar: '',
      receiverId: 'current-user',
      timestamp: new Date(Date.now() - 86400000 * 2),
      read: true,
      delivered: true,
    },
  ],
};

export const useMessagingStore = create<MessagingState>((set, get) => ({
  // Initial state
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
    set({ currentConversation: conversation, messages: [], currentPage: 1 });
    if (conversation) {
      get().loadMessages(conversation.id);
      get().markConversationAsRead(conversation.id);
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      conversations: state.conversations.map((conv) =>
        conv.id === message.conversationId
          ? {
              ...conv,
              lastMessage: message,
              unreadCount:
                message.senderId !== 'current-user'
                  ? conv.id === state.currentConversation?.id
                    ? conv.unreadCount
                    : conv.unreadCount + 1
                  : conv.unreadCount,
              updatedAt: new Date(),
            }
          : conv
      ),
    }));
  },

  sendMessage: (content, attachments) => {
    const state = get();
    if (!state.currentConversation) return;

    const otherParticipant = state.currentConversation.participants.find(
      (p) => p.id !== 'current-user'
    );

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversationId: state.currentConversation.id,
      content,
      senderId: 'current-user',
      senderName: 'You',
      senderAvatar: '',
      receiverId: otherParticipant?.id || '',
      timestamp: new Date(),
      read: false,
      delivered: true,
      attachments,
    };

    get().addMessage(newMessage);

    // Emit via socket if connected
    if (state.socket) {
      state.socket.emit('message', newMessage);
    }

    // Simulate delivery receipt
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === newMessage.id ? { ...msg, delivered: true } : msg
        ),
      }));
    }, 500);

    // Simulate read receipt for demo
    setTimeout(() => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === newMessage.id ? { ...msg, read: true } : msg
        ),
      }));
    }, 3000);

    // Simulate reply for demo purposes
    if (otherParticipant) {
      setTimeout(() => {
        get().addTypingUser(otherParticipant.id);
      }, 1500);

      setTimeout(() => {
        get().removeTypingUser(otherParticipant.id);
        const replies = [
          'That\'s a great point! Let me think about that.',
          'Thanks for sharing. I\'ll get back to you shortly.',
          'Interesting! Would you like to discuss this further?',
          'Got it, I\'ll review this and respond soon.',
          'Great question! Here\'s what I think...',
        ];
        const replyMessage: Message = {
          id: `msg-${Date.now()}-reply`,
          conversationId: state.currentConversation!.id,
          content: replies[Math.floor(Math.random() * replies.length)],
          senderId: otherParticipant.id,
          senderName: otherParticipant.name,
          senderAvatar: otherParticipant.avatar,
          receiverId: 'current-user',
          timestamp: new Date(),
          read: false,
          delivered: true,
        };
        get().addMessage(replyMessage);
      }, 4000);
    }

    // Stop typing indicator after sending
    get().setTyping(false);
  },

  markMessageAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, read: true } : msg
      ),
    }));

    const socket = get().socket;
    if (socket) {
      socket.emit('read', { messageId });
    }
  },

  markConversationAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
      messages: state.messages.map((msg) =>
        msg.conversationId === conversationId && msg.senderId !== 'current-user'
          ? { ...msg, read: true }
          : msg
      ),
    }));
  },

  setTyping: (isTyping) => {
    set({ isTyping });
    const socket = get().socket;
    if (socket && get().currentConversation) {
      socket.emit('typing', {
        conversationId: get().currentConversation!.id,
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
    // For demo/offline mode, we just load mock data without actually connecting
    get().loadConversations();

    try {
      const socket = io(
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001',
        {
          autoConnect: false, // Don't auto-connect for demo
        }
      );

      socket.on('connect', () => {
        set({ isConnected: true });
      });

      socket.on('disconnect', () => {
        set({ isConnected: false });
      });

      socket.on('message', (message: Message) => {
        get().addMessage(message);
      });

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
      // Socket connection failed, continue in offline/demo mode
      console.log('WebSocket connection not available, running in demo mode');
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  loadConversations: () => {
    set({ isLoadingConversations: true });
    // Simulate API call
    setTimeout(() => {
      set({
        conversations: MOCK_CONVERSATIONS,
        isLoadingConversations: false,
      });
    }, 300);
  },

  loadMessages: (conversationId, page = 1) => {
    set({ isLoadingMessages: true });
    // Simulate API call with pagination
    setTimeout(() => {
      const allMessages = MOCK_MESSAGES[conversationId] || [];
      const pageSize = 20;
      const start = Math.max(0, allMessages.length - page * pageSize);
      const end = allMessages.length - (page - 1) * pageSize;
      const pageMessages = allMessages.slice(start, end);

      set((state) => ({
        messages:
          page === 1
            ? pageMessages
            : [...pageMessages, ...state.messages],
        isLoadingMessages: false,
        hasMoreMessages: start > 0,
        currentPage: page,
      }));
    }, 300);
  },

  loadMoreMessages: () => {
    const state = get();
    if (state.currentConversation && state.hasMoreMessages && !state.isLoadingMessages) {
      get().loadMessages(state.currentConversation.id, state.currentPage + 1);
    }
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
    // Simulate file upload
    return new Promise<Attachment[]>((resolve) => {
      setTimeout(() => {
        const attachments: Attachment[] = files.map((file, index) => ({
          id: `att-${Date.now()}-${index}`,
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          size: file.size,
        }));
        set({ uploadingFiles: false, selectedFiles: [] });
        resolve(attachments);
      }, 1000);
    });
  },

  createConversation: (participantId) => {
    const participant = MOCK_PARTICIPANTS.find((p) => p.id === participantId);
    if (!participant) return;

    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      participants: [
        { id: 'current-user', name: 'You', avatar: '', role: 'student', online: true },
        participant,
      ],
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversation: newConversation,
      messages: [],
    }));
  },

  getTotalUnreadCount: () => {
    return get().conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  },
}));