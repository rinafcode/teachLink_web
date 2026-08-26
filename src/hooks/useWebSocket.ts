import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ConnectionSupervisor,
  RawWebSocketTransport,
  type ConnectionStatus as RealtimeConnectionStatus,
  registerSupervisor,
} from '@/lib/realtime/connectionSupervisor';
import { useRealtimeConnection } from './useRealtimeConnection';

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
  /** Unified realtime connection status shared by all realtime hooks. */
  connection: RealtimeConnectionStatus;
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
  const connectionName = useMemo(() => (url ? `websocket:${url}` : 'broadcast'), [url]);
  const realtimeConnection = useRealtimeConnection(connectionName);

  const [mode, setMode] = useState<ConnectionMode>('disabled');
  const [lastMessage, setLastMessage] = useState<TMessage | null>(null);
  const [parseFailed, setParseFailed] = useState(false);

  const supervisorRef = useRef<ConnectionSupervisor | null>(null);
  const transportRef = useRef<RawWebSocketTransport | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Stabilize parse/serialize callbacks to prevent reconnect thrashing
  const parseRef = useRef(parse);
  const serializeRef = useRef(serialize);

  useEffect(() => {
    parseRef.current = parse;
  }, [parse]);

  useEffect(() => {
    serializeRef.current = serialize;
  }, [serialize]);

  const canUseWindow = typeof window !== 'undefined';

  const safeParse = useCallback(
    (raw: string): TMessage => {
      if (parseRef.current) {
        return parseRef.current(raw);
      }
      return JSON.parse(raw) as TMessage;
    },
    [],
  );

  const safeSerialize = useCallback(
    (message: TMessage): string => {
      if (serializeRef.current) {
        return serializeRef.current(message);
      }
      return JSON.stringify(message);
    },
    [],
  );

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !canUseWindow) {
      cleanup();
      supervisorRef.current?.disconnect();
      supervisorRef.current = null;
      transportRef.current = null;
      setMode('disabled');
      return;
    }

    if (url) {
      const transport = new RawWebSocketTransport(url);
      transportRef.current = transport;
      const supervisor = new ConnectionSupervisor(transport, {
        initialReconnectDelayMs: reconnectDelayMs,
      });
      supervisorRef.current = supervisor;
      const unregister = registerSupervisor(connectionName, supervisor);

      const unsubscribeMessage = transport.onMessage((payload) => {
        try {
          setLastMessage(safeParse(String(payload)));
          setParseFailed(false);
        } catch {
          setParseFailed(true);
        }
      });

      setMode('websocket');
      supervisor.connect();

      return () => {
        unsubscribeMessage();
        unregister();
        supervisor.disconnect();
        supervisorRef.current = null;
        transportRef.current = null;
      };
    }

    const channelName = localChannelKey ?? `collaboration-room:${roomId ?? 'default'}`;
    setMode('broadcast');

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      setLastMessage(event.data as TMessage);
    };

    return () => {
      cleanup();
    };
  }, [canUseWindow, cleanup, connectionName, enabled, localChannelKey, reconnectDelayMs, roomId, url]);

  const status: ConnectionStatus = parseFailed
    ? 'error'
    : mode === 'broadcast'
      ? 'connected'
      : realtimeConnection.isConnected
        ? 'connected'
        : realtimeConnection.phase === 'connecting' || realtimeConnection.phase === 'reconnecting'
          ? 'connecting'
          : realtimeConnection.phase === 'idle' && enabled
            ? 'connecting'
            : 'disconnected';

  const sendMessage = useCallback(
    (message: TMessage) => {
      if (!enabled) {
        return;
      }

      if (mode === 'websocket' && supervisorRef.current) {
        // Bounded, ordered outbound queue — messages sent while disconnected are
        // buffered and flushed in order on reconnect (drop-oldest on overflow).
        supervisorRef.current.send(safeSerialize(message));
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
    connection: realtimeConnection,
  };
};
