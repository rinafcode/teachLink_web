'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
    FiSearch,
    FiMessageCircle,
} from 'react-icons/fi';
import type { Conversation } from '@/app/store/messagingStore';

interface ConversationListProps {
    conversations: Conversation[];
    currentConversationId: string | null;
    isLoading: boolean;
    searchQuery: string;
    onSelectConversation: (id: string) => void;
    onSearchChange: (query: string) => void;
}

function UnreadIndicator({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-full shadow-sm shadow-purple-500/30 animate-pulse">
            {count > 99 ? '99+' : count}
        </span>
    );
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(name: string) {
    const colors = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-orange-500',
        'from-rose-500 to-pink-500',
        'from-indigo-500 to-blue-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

export default function ConversationList({
    conversations,
    currentConversationId,
    isLoading,
    searchQuery,
    onSelectConversation,
    onSearchChange,
}: ConversationListProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-3">
                <div
                    className={`relative flex items-center rounded-xl transition-all duration-300 ${isFocused
                        ? 'bg-white dark:bg-gray-700 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                        }`}
                >
                    <FiSearch className="absolute left-3 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full py-2.5 pl-10 pr-4 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
                        id="conversation-search"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="space-y-2 p-3">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                            >
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                            <FiMessageCircle className="w-7 h-7 text-violet-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Start a new conversation to begin messaging'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0.5 px-2">
                        {conversations.map((conversation) => {
                            const otherParticipant = conversation.participants.find(
                                (p) => p.id !== 'current-user'
                            );
                            const isActive = currentConversationId === conversation.id;
                            const hasUnread = conversation.unreadCount > 0;

                            if (!otherParticipant) return null;

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${isActive
                                        ? 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 shadow-sm ring-1 ring-violet-200/50 dark:ring-violet-800/30'
                                        : hasUnread
                                            ? 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    id={`conversation-${conversation.id}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div
                                            className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(
                                                otherParticipant.name
                                            )} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}
                                        >
                                            {getInitials(otherParticipant.name)}
                                        </div>
                                        {/* Online indicator */}
                                        {otherParticipant.online && (
                                            <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-900 shadow-sm" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-sm truncate ${hasUnread
                                                    ? 'font-bold text-gray-900 dark:text-white'
                                                    : 'font-medium text-gray-700 dark:text-gray-200'
                                                    }`}
                                            >
                                                {otherParticipant.name}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                                                {conversation.lastMessage
                                                    ? formatDistanceToNow(
                                                        new Date(conversation.lastMessage.timestamp),
                                                        { addSuffix: false }
                                                    )
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={`text-xs truncate ${hasUnread
                                                    ? 'text-gray-700 dark:text-gray-300 font-medium'
                                                    : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                            >
                                                {conversation.lastMessage
                                                    ? conversation.lastMessage.senderId === 'current-user'
                                                        ? `You: ${conversation.lastMessage.content.replace(/<[^>]*>/g, '')}`
                                                        : conversation.lastMessage.content.replace(/<[^>]*>/g, '')
                                                    : 'Start a conversation...'}
                                            </p>
                                            <UnreadIndicator count={conversation.unreadCount} />
                                        </div>
                                    </div>

                                    {/* Role Badge */}
                                    {otherParticipant.role === 'instructor' && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                                                Instructor
                                            </span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}