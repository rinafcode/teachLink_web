import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import { applyTextOperation } from '../operations';
import type { CollaborationMessage, PresenceState, SyncState } from '../types';

interface RoomState {
  content: string;
  version: number;
  presence: Map<string, PresenceState>;
}

const roomStore = new Map<string, RoomState>();
const socketMembership = new Map<string, Array<{ roomId: string; clientId: string }>>();

const getRoomState = (roomId: string): RoomState => {
  const existing = roomStore.get(roomId);
  if (existing) {
    return existing;
  }

  const created: RoomState = {
    content: '',
    version: 0,
    presence: new Map<string, PresenceState>(),
  };

  roomStore.set(roomId, created);
  return created;
};

const buildSyncState = (roomId: string, roomState: RoomState): SyncState => {
  return {
    roomId,
    content: roomState.content,
    version: roomState.version,
    presence: [...roomState.presence.values()],
  };
};

const emitSync = (socket: Socket, roomId: string, roomState: RoomState): void => {
  socket.emit('collaboration:message', {
    type: 'sync',
    state: buildSyncState(roomId, roomState),
  } satisfies CollaborationMessage);
};

export const setupCollaborationWebSocketServer = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/api/collaboration/socket',
  });

  io.on('connection', (socket: Socket) => {
    socket.on('collaboration:message', (message: CollaborationMessage) => {
      if (message.type === 'join') {
        const roomState = getRoomState(message.roomId);

        socket.join(message.roomId);
        roomState.presence.set(message.presence.clientId, message.presence);
        socketMembership.set(socket.id, [
          ...(socketMembership.get(socket.id) ?? []),
          { roomId: message.roomId, clientId: message.presence.clientId },
        ]);

        emitSync(socket, message.roomId, roomState);
        socket.to(message.roomId).emit('collaboration:message', {
          type: 'presence',
          roomId: message.roomId,
          presence: message.presence,
        } satisfies CollaborationMessage);

        return;
      }

      if (message.type === 'presence') {
        const roomState = getRoomState(message.roomId);
        roomState.presence.set(message.presence.clientId, message.presence);
        socket.to(message.roomId).emit('collaboration:message', message);
        return;
      }

      if (message.type === 'operation') {
        const roomState = getRoomState(message.roomId);

        if (message.operation.baseVersion > roomState.version) {
          emitSync(socket, message.roomId, roomState);
          return;
        }

        roomState.content = applyTextOperation(roomState.content, message.operation);
        roomState.version += 1;

        socket.emit('collaboration:message', {
          type: 'ack',
          roomId: message.roomId,
          operationId: message.operation.id,
          version: roomState.version,
        } satisfies CollaborationMessage);

        io.to(message.roomId).emit('collaboration:message', {
          ...message,
          version: roomState.version,
        } satisfies CollaborationMessage);
      }
    });

    socket.on('disconnect', () => {
      const memberships = socketMembership.get(socket.id) ?? [];

      memberships.forEach(({ roomId, clientId }) => {
        const roomState = roomStore.get(roomId);
        if (!roomState) {
          return;
        }

        roomState.presence.delete(clientId);

        if (roomState.presence.size === 0) {
          roomStore.delete(roomId);
        }
      });

      socketMembership.delete(socket.id);
    });
  });

  return io;
};
