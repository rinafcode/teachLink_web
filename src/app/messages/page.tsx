'use client';


import ConversationList from '@/app/components/messaging/ConversationList';
import MessageThread from '@/app/components/messaging/MessageThread';
import MessageComposer from '@/app/components/messaging/MessageComposer';
import { useMessaging } from '@/app/hooks/useMessaging';
import { useMessagingStore } from '@/app/store/messagingStore';
import { FiMessageCircle, FiChevronLeft, FiWifi, FiWifiOff } from 'react-icons/fi';

export default function MessagesPage() {
  const {
    conversations,
    currentConversation,
    messages,
    isConnected,
    typingUsers,
    isLoadingMessages,
    isLoadingConversations,
    hasMoreMessages,
    searchQuery,
    selectedFiles,
    uploadingFiles,
    totalUnreadCount,
    handleSelectConversation,
    handleSendMessage,
    handleTypingStart,
    handleTypingStop,
    handleFileSelect,
    loadMoreMessages,
    setSearchQuery,
    removeSelectedFile,
    markMessageAsRead,
    getOtherParticipant,
    getTypingUserNames,
  } = useMessaging();

  const [showSidebar, setShowSidebar] = useState(true);

  const otherParticipant = currentConversation
    ? currentConversation.participants.find((p) => p.id !== 'current-user')
    : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shadow-purple-500/20">
            <FiMessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Messages
              {totalUnreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-full shadow-sm">
                  {totalUnreadCount}
                </span>
              )}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Stay connected with your instructors and peers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
              }`}
          >
            {isConnected ? (
              <>
                <FiWifi className="w-3 h-3" />
                Connected
              </>
            ) : (
              <>
                <FiWifiOff className="w-3 h-3" />
                Demo Mode
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div
          className={`${showSidebar ? 'w-80 lg:w-96' : 'w-0'
            } flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-300 overflow-hidden ${currentConversation ? 'hidden md:block' : 'block'
            }`}
        >
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id || null}
            isLoading={isLoadingConversations}
            searchQuery={searchQuery}
            onSelectConversation={(id) => {
              handleSelectConversation(id);
            }}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 min-h-0 ${!currentConversation ? 'hidden md:flex' : 'flex'
            }`}
        >
          {/* Mobile Back Button */}
          {currentConversation && (
            <button
              onClick={() => {
                useMessagingStore.getState().setCurrentConversation(null);
              }}
              className="md:hidden flex items-center gap-2 px-4 py-2 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
              id="back-to-conversations"
            >
              <FiChevronLeft className="w-4 h-4" />
              Back to conversations
            </button>
          )}

          <MessageThread
            messages={messages}
            conversationId={currentConversation?.id || null}
            typingText={getTypingUserNames()}
            isLoadingMessages={isLoadingMessages}
            hasMoreMessages={hasMoreMessages}
            onLoadMore={loadMoreMessages}
            onMarkAsRead={markMessageAsRead}
            participantName={otherParticipant?.name || ''}
            participantOnline={otherParticipant?.online || false}
          />

          {currentConversation && (
            <MessageComposer
              onSendMessage={handleSendMessage}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              onFileSelect={handleFileSelect}
              selectedFiles={selectedFiles}
              onRemoveFile={removeSelectedFile}
              isUploading={uploadingFiles}
              disabled={!currentConversation}
            />
          )}
        </div>
      </div>
    </div>
  );
}