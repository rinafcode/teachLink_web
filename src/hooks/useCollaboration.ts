import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Awareness } from 'y-protocols/awareness';
import {
  BaseRealtimeTransport,
  ConnectionSupervisor,
  registerSupervisor,
} from '@/lib/realtime/connectionSupervisor';
import { useRealtimeConnection } from './useRealtimeConnection';

/**
 * Bridges the y-websocket provider's lifecycle into the shared connection
 * supervisor. y-websocket owns the actual transport and reconnection, so the
 * supervisor runs with `manageReconnect: false` and only mirrors the unified
 * status for consumers.
 */
class CollaborationTransport extends BaseRealtimeTransport {
  readonly name = 'collaboration';

  constructor(private readonly provider: WebsocketProvider) {
    super();
  }

  connect(): void {
    // y-websocket owns the socket; nothing to do here.
  }

  isOpen(): boolean {
    return this.provider.ws?.readyState === WebSocket.OPEN;
  }

  bridgeConnected(): void {
    this.events.emitOpen();
  }

  bridgeDisconnected(): void {
    this.events.emitClose();
  }
}

type CursorPosition = {
  line: number;
  column: number;
};

export type CollaborationUser = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isSharingScreen?: boolean;
  isActive?: boolean;
  isHost?: boolean;
  cursor?: CursorPosition;
};

export type CollaborationMessage = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

export type WhiteboardPathPoint = {
  x: number;
  y: number;
};

export type WhiteboardStroke = {
  id: string;
  userId: string;
  color: string;
  width: number;
  path: WhiteboardPathPoint[];
};

export function useCollaboration(roomId: string, user: CollaborationUser, websocketUrl?: string) {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>(
    'idle',
  );
  const [editorText, setEditorText] = useState('');
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connectionName = `collaboration:${roomId}`;
  const connection = useRealtimeConnection(connectionName);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const strokesRef = useRef<Y.Array<WhiteboardStroke> | null>(null);
  const chatRef = useRef<Y.Array<CollaborationMessage> | null>(null);
  const supervisorRef = useRef<ConnectionSupervisor | null>(null);

  const websocketEndpoint =
    websocketUrl ||
    process.env.NEXT_PUBLIC_YJS_WEBSOCKET_URL ||
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
    'ws://localhost:1234';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new WebsocketProvider(websocketEndpoint, roomId, doc, {
      connect: true,
    });
    providerRef.current = provider;
    awarenessRef.current = provider.awareness;

    // Register the unified connection status for this collaboration room.
    const transport = new CollaborationTransport(provider);
    const supervisor = new ConnectionSupervisor(transport, { manageReconnect: false });
    supervisorRef.current = supervisor;
    const unregisterSupervisor = registerSupervisor(connectionName, supervisor);

    const updatePresence = () => {
      const states = Array.from(awarenessRef.current?.getStates().values() ?? []);
      const nextUsers: CollaborationUser[] = states
        .filter((state) => Boolean(state.user))
        .map((state) => ({
          ...(state.user as CollaborationUser),
          isActive: true,
          cursor: state.cursor as CursorPosition | undefined,
          isSharingScreen: Boolean(state.isSharingScreen),
        }));
      setUsers(nextUsers);
    };

    awarenessRef.current.setLocalStateField('user', {
      ...user,
      isActive: true,
      cursor: { line: 1, column: 1 },
    });
    awarenessRef.current.setLocalStateField('lastSeen', Date.now());
    awarenessRef.current.on('change', updatePresence);
    updatePresence();

    yTextRef.current = doc.getText('shared-editor');
    setEditorText(yTextRef.current.toString());
    yTextRef.current.observe(() => {
      setEditorText(yTextRef.current?.toString() ?? '');
    });

    strokesRef.current = doc.getArray<WhiteboardStroke>('whiteboard-strokes');
    setWhiteboardStrokes(strokesRef.current.toArray());
    strokesRef.current.observe(() => {
      setWhiteboardStrokes(strokesRef.current?.toArray() ?? []);
    });

    chatRef.current = doc.getArray<CollaborationMessage>('collab-chat');
    setMessages(chatRef.current.toArray());
    chatRef.current.observe(() => {
      setMessages(chatRef.current?.toArray() ?? []);
    });

    provider.on('status', ({ status: providerStatus }) => {
      setConnected(providerStatus === 'connected');
      setStatus(providerStatus === 'connected' ? 'connected' : 'disconnected');
      if (providerStatus === 'connected') {
        transport.bridgeConnected();
      } else {
        transport.bridgeDisconnected();
      }
    });

    provider.on('sync', () => {
      setEditorText(yTextRef.current?.toString() ?? '');
      setWhiteboardStrokes(strokesRef.current?.toArray() ?? []);
      setMessages(chatRef.current?.toArray() ?? []);
    });

    return () => {
      awarenessRef.current?.off('change', updatePresence);
      unregisterSupervisor();
      supervisor.disconnect();
      supervisorRef.current = null;
      provider.disconnect();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
      awarenessRef.current = null;
      yTextRef.current = null;
      strokesRef.current = null;
      chatRef.current = null;
    };
  }, [connectionName, roomId, user.id, websocketEndpoint]);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;
    provider.awareness.setLocalStateField('user', {
      ...user,
      isActive: true,
    });
  }, [user.name, user.avatar, user.color]);

  const updateText = (value: string) => {
    if (!yTextRef.current) {
      setEditorText(value);
      return;
    }

    const current = yTextRef.current.toString();
    if (current === value) {
      return;
    }

    yTextRef.current.delete(0, current.length);
    yTextRef.current.insert(0, value);
    setEditorText(value);
  };

  const updateCursor = (cursor: CursorPosition) => {
    awarenessRef.current?.setLocalStateField('cursor', cursor);
  };

  const sendMessage = (text: string) => {
    const now = new Date().toISOString();
    const message: CollaborationMessage = {
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text,
      createdAt: now,
    };
    if (chatRef.current) {
      chatRef.current.push([message]);
    } else {
      setMessages((prev) => [...prev, message]);
    }
  };

  const addWhiteboardStroke = (stroke: WhiteboardStroke) => {
    if (strokesRef.current) {
      strokesRef.current.push([stroke]);
    } else {
      setWhiteboardStrokes((prev) => [...prev, stroke]);
    }
  };

  const clearWhiteboard = () => {
    if (strokesRef.current) {
      strokesRef.current.delete(0, strokesRef.current.length);
    } else {
      setWhiteboardStrokes([]);
    }
  };

  const setSharingScreen = (isSharingScreen: boolean) => {
    awarenessRef.current?.setLocalStateField('isSharingScreen', isSharingScreen);
  };

  const setTool = (tool: string) => {
    awarenessRef.current?.setLocalStateField('tool', tool);
  };

  return {
    connected,
    status,
    connection,
    editorText,
    users,
    messages,
    whiteboardStrokes,
    error,
    updateText,
    updateCursor,
    sendMessage,
    addWhiteboardStroke,
    clearWhiteboard,
    setSharingScreen,
    setTool,
  };
}
