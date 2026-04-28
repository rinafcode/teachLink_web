import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { editor } from 'monaco-editor';
import {
  getLanguageConfig,
  getAllLanguages,
  formatCode as formatCodeUtil,
  validateCode,
  simulateCodeExecution,
  type ExecutionResult,
  type LanguageConfig,
} from '@/utils/codeUtils';
import {
  applyTextOperation,
  createTextOperationFromChange,
  transformIncomingOperation,
  type CollaborationMessage,
  type PresenceState,
  type TextOperation,
} from '@/features/collaboration';
import { useWebSocket } from './useWebSocket';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  cursorLine?: number;
  cursorColumn?: number;
  isSelf?: boolean;
  lastActiveAt?: number;
}

export interface UseCodeEditorOptions {
  initialCode?: string;
  initialLanguage?: string;
  roomId?: string;
  onCodeChange?: (code: string) => void;
}

export interface UseCodeEditorReturn {
  // State
  code: string;
  language: string;
  theme: 'vs-dark' | 'light';
  fontSize: number;
  isRunning: boolean;
  output: ExecutionResult | null;
  validationErrors: Array<{ line: number; message: string }>;
  collaborators: Collaborator[];
  isCollaborationConnected: boolean;
  autoCompleteEnabled: boolean;
  currentWord: string;

  // Config helpers
  languages: LanguageConfig[];
  languageConfig: LanguageConfig;

  // Actions
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  toggleTheme: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  runCode: () => Promise<void>;
  handleFormat: () => void;
  resetCode: () => void;
  clearOutput: () => void;
  toggleAutoComplete: () => void;
  setCurrentWord: (word: string) => void;

  // Monaco editor ref
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>;
  handleEditorMount: (editorInstance: editor.IStandaloneCodeEditor) => void;
}

const PRESENCE_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

const randomName = (): string => {
  const names = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Reese'];
  return names[Math.floor(Math.random() * names.length)] ?? 'Collaborator';
};

const buildSelfPresence = (roomId: string): PresenceState => {
  const timestamp = Date.now();
  const clientId = `client-${timestamp}-${Math.random().toString(36).slice(2, 7)}`;
  const name = `${randomName()} ${Math.floor(Math.random() * 90) + 10}`;
  const color = PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)] ?? '#6366f1';

  return {
    clientId,
    roomId,
    name,
    color,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    cursor: { line: 1, column: 1 },
    lastActiveAt: timestamp,
  };
};

const mapPresenceToCollaborator = (presence: PresenceState, selfId: string): Collaborator => {
  return {
    id: presence.clientId,
    name: presence.name,
    color: presence.color,
    avatar: presence.avatar,
    cursorLine: presence.cursor?.line,
    cursorColumn: presence.cursor?.column,
    isSelf: presence.clientId === selfId,
    lastActiveAt: presence.lastActiveAt,
  };
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCodeEditor = ({
  initialCode,
  initialLanguage = 'javascript',
  roomId,
  onCodeChange,
}: UseCodeEditorOptions = {}): UseCodeEditorReturn => {
  const langConfig = getLanguageConfig(initialLanguage);

  const [language, setLanguageState] = useState<string>(initialLanguage);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark');
  const [fontSize, setFontSize] = useState<number>(14);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ line: number; message: string }>
  >([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState<boolean>(true);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [code, setCodeState] = useState<string>(initialCode ?? langConfig.defaultCode);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const codeRef = useRef<string>(initialCode ?? langConfig.defaultCode);
  const versionRef = useRef<number>(0);
  const pendingOperationsRef = useRef<TextOperation[]>([]);
  const cursorRef = useRef<{ line: number; column: number }>({ line: 1, column: 1 });
  const applyingRemoteUpdateRef = useRef<boolean>(false);
  const lastPresenceBroadcastRef = useRef<number>(0);

  const selfPresence = useMemo(() => buildSelfPresence(roomId ?? 'local-room'), [roomId]);
  const selfPresenceRef = useRef<PresenceState>(selfPresence);

  useEffect(() => {
    selfPresenceRef.current = selfPresence;
  }, [selfPresence]);

  const {
    isConnected: isCollaborationConnected,
    lastMessage,
    sendMessage,
  } = useWebSocket<CollaborationMessage>({
    enabled: Boolean(roomId),
    roomId,
    url: process.env.NEXT_PUBLIC_COLLAB_WS_URL,
    localChannelKey: roomId ? `teachlink-collab:${roomId}` : undefined,
  });

  const upsertCollaborator = useCallback((presence: PresenceState) => {
    setCollaborators((previous) => {
      const nextCollaborator = mapPresenceToCollaborator(
        presence,
        selfPresenceRef.current.clientId,
      );
      const existingIndex = previous.findIndex(
        (collaborator) => collaborator.id === nextCollaborator.id,
      );

      if (existingIndex === -1) {
        return [...previous, nextCollaborator];
      }

      const cloned = [...previous];
      cloned[existingIndex] = nextCollaborator;
      return cloned;
    });
  }, []);

  const applyRemoteCode = useCallback(
    (nextCode: string) => {
      applyingRemoteUpdateRef.current = true;
      codeRef.current = nextCode;
      setCodeState(nextCode);
      onCodeChange?.(nextCode);

      const result = validateCode(language, nextCode);
      setValidationErrors(result.errors);

      setTimeout(() => {
        applyingRemoteUpdateRef.current = false;
      }, 0);
    },
    [language, onCodeChange],
  );

  const broadcastPresence = useCallback(() => {
    if (!roomId) {
      return;
    }

    const now = Date.now();
    const nextPresence: PresenceState = {
      ...selfPresenceRef.current,
      roomId,
      cursor: { ...cursorRef.current },
      lastActiveAt: now,
    };

    selfPresenceRef.current = nextPresence;
    upsertCollaborator(nextPresence);

    sendMessage({
      type: 'presence',
      roomId,
      presence: nextPresence,
    });
  }, [roomId, sendMessage, upsertCollaborator]);

  useEffect(() => {
    if (!roomId) {
      setCollaborators([]);
      return;
    }

    if (!isCollaborationConnected) {
      setCollaborators([
        mapPresenceToCollaborator(selfPresenceRef.current, selfPresenceRef.current.clientId),
      ]);
      return;
    }

    sendMessage({
      type: 'join',
      roomId,
      presence: {
        ...selfPresenceRef.current,
        roomId,
      },
    });

    broadcastPresence();

    const heartbeat = setInterval(() => {
      broadcastPresence();
    }, 10000);

    return () => {
      clearInterval(heartbeat);
    };
  }, [broadcastPresence, isCollaborationConnected, roomId, sendMessage]);

  useEffect(() => {
    if (!lastMessage || !roomId) {
      return;
    }

    if (lastMessage.type === 'sync' && lastMessage.state.roomId === roomId) {
      versionRef.current = lastMessage.state.version;
      pendingOperationsRef.current = [];
      applyRemoteCode(lastMessage.state.content);
      setCollaborators(
        lastMessage.state.presence.map((presence) =>
          mapPresenceToCollaborator(presence, selfPresenceRef.current.clientId),
        ),
      );
      return;
    }

    if ('roomId' in lastMessage && lastMessage.roomId !== roomId) {
      return;
    }

    if (lastMessage.type === 'presence') {
      upsertCollaborator(lastMessage.presence);
      return;
    }

    if (lastMessage.type === 'ack') {
      pendingOperationsRef.current = pendingOperationsRef.current.filter(
        (operation) => operation.id !== lastMessage.operationId,
      );
      versionRef.current = Math.max(versionRef.current, lastMessage.version);
      return;
    }

    if (lastMessage.type === 'operation') {
      if (lastMessage.operation.clientId === selfPresenceRef.current.clientId) {
        pendingOperationsRef.current = pendingOperationsRef.current.filter(
          (operation) => operation.id !== lastMessage.operation.id,
        );
        versionRef.current = Math.max(versionRef.current, lastMessage.version);
        return;
      }

      const transformedOperation = transformIncomingOperation(
        lastMessage.operation,
        pendingOperationsRef.current,
      );
      const nextCode = applyTextOperation(codeRef.current, transformedOperation);
      versionRef.current = Math.max(versionRef.current, lastMessage.version);
      applyRemoteCode(nextCode);

      if (lastMessage.presence) {
        upsertCollaborator(lastMessage.presence);
      }
    }
  }, [applyRemoteCode, lastMessage, roomId, upsertCollaborator]);

  // -------------------------------------------------------------------------
  // Setters
  // -------------------------------------------------------------------------

  const setCode = useCallback(
    (newCode: string) => {
      const previousCode = codeRef.current;
      if (previousCode === newCode) {
        return;
      }

      codeRef.current = newCode;
      setCodeState(newCode);
      onCodeChange?.(newCode);
      const result = validateCode(language, newCode);
      setValidationErrors(result.errors);

      if (!roomId || applyingRemoteUpdateRef.current) {
        return;
      }

      const timestamp = Date.now();
      const operation = createTextOperationFromChange(previousCode, newCode, {
        roomId,
        clientId: selfPresenceRef.current.clientId,
        baseVersion: versionRef.current,
        timestamp,
      });

      if (!operation) {
        return;
      }

      pendingOperationsRef.current = [...pendingOperationsRef.current, operation];
      versionRef.current += 1;
      sendMessage({
        type: 'operation',
        roomId,
        operation,
        version: versionRef.current,
        presence: {
          ...selfPresenceRef.current,
          cursor: { ...cursorRef.current },
          lastActiveAt: timestamp,
        },
      });
    },
    [language, onCodeChange, roomId, sendMessage],
  );

  const setLanguage = useCallback(
    (lang: string) => {
      setLanguageState(lang);
      const config = getLanguageConfig(lang);
      setCodeState(config.defaultCode);
      codeRef.current = config.defaultCode;
      onCodeChange?.(config.defaultCode);
      setOutput(null);
      setValidationErrors([]);
    },
    [onCodeChange],
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'vs-dark' ? 'light' : 'vs-dark'));
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + 2, 28));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - 2, 10));
  }, []);

  // -------------------------------------------------------------------------
  // Code actions
  // -------------------------------------------------------------------------

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setOutput(null);

    // Simulate async execution delay
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    const result = simulateCodeExecution(language, code);
    setOutput(result);
    setIsRunning(false);
  }, [language, code]);

  const handleFormat = useCallback(() => {
    const formatted = formatCodeUtil(language, codeRef.current);
    setCode(formatted);
    if (editorRef.current) {
      editorRef.current.setValue(formatted);
    }
  }, [language, setCode]);

  const resetCode = useCallback(() => {
    const config = getLanguageConfig(language);
    setCode(config.defaultCode);
    setOutput(null);
    setValidationErrors([]);
    if (editorRef.current) {
      editorRef.current.setValue(config.defaultCode);
    }
  }, [language, setCode]);

  const clearOutput = useCallback(() => setOutput(null), []);

  const toggleAutoComplete = useCallback(() => {
    setAutoCompleteEnabled((prev) => !prev);
  }, []);

  // -------------------------------------------------------------------------
  // Monaco mount handler
  // -------------------------------------------------------------------------

  const handleEditorMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;

      // Track cursor word for auto-completion panel
      editorInstance.onDidChangeCursorPosition(() => {
        const position = editorInstance.getPosition();
        if (!position) return;

        cursorRef.current = { line: position.lineNumber, column: position.column };
        const model = editorInstance.getModel();
        if (!model) return;
        const word = model.getWordAtPosition(position);
        setCurrentWord(word?.word ?? '');

        const now = Date.now();
        if (roomId && now - lastPresenceBroadcastRef.current > 120) {
          lastPresenceBroadcastRef.current = now;
          broadcastPresence();
        }
      });
    },
    [broadcastPresence, roomId],
  );

  return {
    // State
    code,
    language,
    theme,
    fontSize,
    isRunning,
    output,
    validationErrors,
    collaborators,
    isCollaborationConnected,
    autoCompleteEnabled,
    currentWord,

    // Config helpers
    languages: getAllLanguages(),
    languageConfig: getLanguageConfig(language),

    // Actions
    setCode,
    setLanguage,
    toggleTheme,
    increaseFontSize,
    decreaseFontSize,
    runCode,
    handleFormat,
    resetCode,
    clearOutput,
    toggleAutoComplete,
    setCurrentWord,

    // Monaco ref
    editorRef,
    handleEditorMount,
  };
};
