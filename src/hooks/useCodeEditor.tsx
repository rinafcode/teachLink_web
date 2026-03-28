import { useState, useCallback, useRef } from 'react';
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

// ---------------------------------------------------------------------------
// Mock collaborator data (simulates Socket.IO presence)
// ---------------------------------------------------------------------------

const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: 'user-1',
    name: 'Alice',
    color: '#6366f1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    cursorLine: 3,
    cursorColumn: 10,
  },
  {
    id: 'user-2',
    name: 'Bob',
    color: '#ec4899',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    cursorLine: 7,
    cursorColumn: 5,
  },
  {
    id: 'user-3',
    name: 'Charlie',
    color: '#10b981',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
    cursorLine: 12,
    cursorColumn: 1,
  },
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCodeEditor = ({
  initialCode,
  initialLanguage = 'javascript',
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
  const [collaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState<boolean>(true);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [code, setCodeState] = useState<string>(initialCode ?? langConfig.defaultCode);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // -------------------------------------------------------------------------
  // Setters
  // -------------------------------------------------------------------------

  const setCode = useCallback(
    (newCode: string) => {
      setCodeState(newCode);
      onCodeChange?.(newCode);
      const result = validateCode(language, newCode);
      setValidationErrors(result.errors);
    },
    [language, onCodeChange],
  );

  const setLanguage = useCallback(
    (lang: string) => {
      setLanguageState(lang);
      const config = getLanguageConfig(lang);
      setCodeState(config.defaultCode);
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
    const formatted = formatCodeUtil(language, code);
    setCodeState(formatted);
    onCodeChange?.(formatted);
    if (editorRef.current) {
      editorRef.current.setValue(formatted);
    }
  }, [language, code, onCodeChange]);

  const resetCode = useCallback(() => {
    const config = getLanguageConfig(language);
    setCodeState(config.defaultCode);
    onCodeChange?.(config.defaultCode);
    setOutput(null);
    setValidationErrors([]);
    if (editorRef.current) {
      editorRef.current.setValue(config.defaultCode);
    }
  }, [language, onCodeChange]);

  const clearOutput = useCallback(() => setOutput(null), []);

  const toggleAutoComplete = useCallback(() => {
    setAutoCompleteEnabled((prev) => !prev);
  }, []);

  // -------------------------------------------------------------------------
  // Monaco mount handler
  // -------------------------------------------------------------------------

  const handleEditorMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    // Track cursor word for auto-completion panel
    editorInstance.onDidChangeCursorPosition(() => {
      const position = editorInstance.getPosition();
      if (!position) return;
      const model = editorInstance.getModel();
      if (!model) return;
      const word = model.getWordAtPosition(position);
      setCurrentWord(word?.word ?? '');
    });
  }, []);

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
