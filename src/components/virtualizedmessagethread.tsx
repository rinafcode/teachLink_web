import React, {
    useCallback,
    useEffect,
    useRef,
    memo,
    useMemo,
  } from "react";
  import { VariableSizeList as List, ListChildComponentProps } from "react-window";
  import AutoSizer from "react-virtualized-auto-sizer";
  
  export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: string | Date;
    isOwn?: boolean;
    attachments?: { name: string; url: string; type: string }[];
    reactions?: { emoji: string; count: number }[];
    status?: "sending" | "sent" | "delivered" | "read" | "failed";
  }
  
  const ESTIMATED_MESSAGE_HEIGHT = 72;
  const ATTACHMENT_EXTRA = 60;
  const REACTIONS_EXTRA = 32;
  
  function estimateMessageHeight(message: Message): number {
    let height = ESTIMATED_MESSAGE_HEIGHT;
    const contentLines = Math.ceil(message.content.length / 60);
    height += Math.max(0, contentLines - 2) * 20;
    if (message.attachments?.length) height += ATTACHMENT_EXTRA;
    if (message.reactions?.length) height += REACTIONS_EXTRA;
    return height;
  }
  
  interface MessageBubbleProps {
    message: Message;
    style: React.CSSProperties;
  }
  
  const MessageBubble = memo(({ message, style }: MessageBubbleProps) => {
    const time =
      message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp);
  
    return (
      <div
        style={style}
        className={`message-wrapper ${message.isOwn ? "message-wrapper--own" : ""}`}
      >
        <div className="message-bubble">
          {!message.isOwn && (
            <div className="message-avatar">
              {message.senderAvatar ? (
                <img src={message.senderAvatar} alt={message.senderName} />
              ) : (
                <span className="message-avatar-initials">
                  {message.senderName[0]}
                </span>
              )}
            </div>
          )}
          <div className="message-content-wrapper">
            {!message.isOwn && (
              <span className="message-sender">{message.senderName}</span>
            )}
            <div className="message-content">
              <p>{message.content}</p>
              {message.attachments?.map((att) => (
                <a
                  key={att.url}
                  href={att.url}
                  className="message-attachment"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📎 {att.name}
                </a>
              ))}
            </div>
            <div className="message-meta">
              <time dateTime={time.toISOString()} className="message-time">
                {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
              {message.isOwn && message.status && (
                <span className={`message-status message-status--${message.status}`}>
                  {message.status}
                </span>
              )}
            </div>
            {message.reactions && message.reactions.length > 0 && (
              <div className="message-reactions">
                {message.reactions.map((r) => (
                  <span key={r.emoji} className="message-reaction">
                    {r.emoji} {r.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });
  
  MessageBubble.displayName = "MessageBubble";
  
  interface VirtualizedMessageThreadProps {
    messages: Message[];
    className?: string;
    /** Scroll to bottom when new messages arrive */
    autoScrollToBottom?: boolean;
  }
  
  const VirtualizedMessageThread: React.FC<VirtualizedMessageThreadProps> = ({
    messages,
    className,
    autoScrollToBottom = true,
  }) => {
    const listRef = useRef<List>(null);
    const heightCache = useRef<Map<string, number>>(new Map());
  
    const getItemSize = useCallback(
      (index: number) => {
        const msg = messages[index];
        if (!msg) return ESTIMATED_MESSAGE_HEIGHT;
        const cached = heightCache.current.get(msg.id);
        if (cached) return cached;
        const h = estimateMessageHeight(msg);
        heightCache.current.set(msg.id, h);
        return h;
      },
      [messages]
    );
  
    // Scroll to bottom when messages change (new message arrives)
    useEffect(() => {
      if (autoScrollToBottom && listRef.current && messages.length > 0) {
        listRef.current.scrollToItem(messages.length - 1, "end");
      }
    }, [messages.length, autoScrollToBottom]);
  
    // Reset height cache when messages change significantly
    const messageIds = useMemo(() => messages.map((m) => m.id).join(","), [messages]);
    useEffect(() => {
      heightCache.current.clear();
      listRef.current?.resetAfterIndex(0);
    }, [messageIds]);
  
    const Row = useCallback(
      ({ index, style }: ListChildComponentProps) => (
        <MessageBubble message={messages[index]} style={style} />
      ),
      [messages]
    );
  
    return (
      <div className={`virtualized-message-thread ${className ?? ""}`}>
        <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
            <List
              ref={listRef}
              height={height}
              itemCount={messages.length}
              itemSize={getItemSize}
              width={width}
              overscanCount={10}
              estimatedItemSize={ESTIMATED_MESSAGE_HEIGHT}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    );
  };
  
  export default VirtualizedMessageThread;