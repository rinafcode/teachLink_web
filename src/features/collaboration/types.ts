export type CollaborationOperationType = 'insert' | 'delete' | 'replace';

export interface CursorPosition {
  line: number;
  column: number;
}

export interface PresenceState {
  clientId: string;
  name: string;
  color: string;
  avatar: string;
  roomId: string;
  cursor?: CursorPosition;
  lastActiveAt: number;
}

export interface TextOperation {
  id: string;
  roomId: string;
  clientId: string;
  baseVersion: number;
  type: CollaborationOperationType;
  index: number;
  length?: number;
  text?: string;
  timestamp: number;
}

export interface SyncState {
  roomId: string;
  content: string;
  version: number;
  presence: PresenceState[];
}

export type CollaborationMessage =
  | {
      type: 'join';
      roomId: string;
      presence: PresenceState;
    }
  | {
      type: 'presence';
      roomId: string;
      presence: PresenceState;
    }
  | {
      type: 'operation';
      roomId: string;
      operation: TextOperation;
      version: number;
      presence?: PresenceState;
    }
  | {
      type: 'sync';
      state: SyncState;
    }
  | {
      type: 'ack';
      roomId: string;
      operationId: string;
      version: number;
    }
  | {
      type: 'error';
      roomId: string;
      message: string;
    };
