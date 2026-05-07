import { useCallback, useEffect, useRef, useState } from 'react';

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
type ConnectionMode = 'websocket' | 'broadcast' | 'disabled';

interface UseWebSocketOptions<TMessage> {
  url?: string;
  roomId?: string;
  localChannelKey?: string;
  enabled?: boolean;
  reconnectDelayMs?: number;
  parse?: (raw: string) => TMessage;
  serialize?: (message: TMessage) => string;
}

interface UseWebSocketResult<TMessage> {
  status: ConnectionStatus;
  isConnected: boolean;
  mode: ConnectionMode;
  lastMessage: TMessage | null;
  sendMessage: (message: TMessage) => void;
}

export const useWebSocket = <TMessage>({
  url,
  roomId,
  localChannelKey,
  enabled = true,
  reconnectDelayMs = 1500,
  parse,
  serialize,
}: UseWebSocketOptions<TMessage>): UseWebSocketResult<TMessage> => {
  const [status, setStatus] = useState<ConnectionStatus>(enabled ? 'connecting' : 'idle');
  const [mode, setMode] = useState<ConnectionMode>('disabled');
  const [lastMessage, setLastMessage] = useState<TMessage | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUseWindow = typeof window !== 'undefined';

  const safeParse = useCallback(
    (raw: string): TMessage => {
      if (parse) {
        return parse(raw);
      }
      return JSON.parse(raw) as TMessage;
    },
    [parse],
  );

  const safeSerialize = useCallback(
    (message: TMessage): string => {
      if (serialize) {
        return serialize(message);
      }
      return JSON.stringify(message);
    },
    [serialize],
  );

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !canUseWindow) {
      cleanup();
      setMode('disabled');
      setStatus(enabled ? 'connecting' : 'idle');
      return;
    }

    if (url) {
      let cancelled = false;

      const connect = () => {
        if (cancelled) {
          return;
        }

        setMode('websocket');
        setStatus('connecting');

        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          if (!cancelled) {
            setStatus('connected');
          }
        };

        socket.onmessage = (event) => {
          try {
            const message = safeParse(String(event.data));
            setLastMessage(message);
          } catch {
            setStatus('error');
          }
        };

        socket.onerror = () => {
          if (!cancelled) {
            setStatus('error');
          }
        };

        socket.onclose = () => {
          if (cancelled) {
            return;
          }

          setStatus('disconnected');
          reconnectTimerRef.current = setTimeout(connect, reconnectDelayMs);
        };
      };

      connect();

      return () => {
        cancelled = true;
        cleanup();
      };
    }

    const channelName = localChannelKey ?? `collaboration-room:${roomId ?? 'default'}`;
    setMode('broadcast');
    setStatus('connected');

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      setLastMessage(event.data as TMessage);
    };

    return () => {
      cleanup();
      setStatus('disconnected');
    };
  }, [canUseWindow, cleanup, enabled, localChannelKey, reconnectDelayMs, roomId, safeParse, url]);

  const sendMessage = useCallback(
    (message: TMessage) => {
      if (!enabled) {
        return;
      }

      if (mode === 'websocket' && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(safeSerialize(message));
        return;
      }

      if (mode === 'broadcast' && channelRef.current) {
        channelRef.current.postMessage(message);
      }
    },
    [enabled, mode, safeSerialize],
  );

  return {
    status,
    isConnected: status === 'connected',
    mode,
    lastMessage,
    sendMessage,
  };
};
