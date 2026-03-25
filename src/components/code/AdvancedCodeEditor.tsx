'use client';

import React, { Suspense } from 'react';
import {
  Play,
  RotateCcw,
  Wand2,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
} from 'lucide-react';
import { useCodeEditor } from '@/hooks/useCodeEditor';
import { SyntaxHighlighter } from './SyntaxHighlighter';
import { AutoCompletion } from './AutoCompletion';
import { CollaborativeEditing } from './CollaborativeEditing';
import type { CompletionSuggestion } from '@/utils/codeUtils';

// Lazy-load Monaco to avoid SSR issues in Next.js
const MonacoEditor = React.lazy(() =>
  import('@monaco-editor/react').then((mod) => ({ default: mod.default })),
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AdvancedCodeEditorProps {
  initialCode?: string;
  initialLanguage?: string;
  roomId?: string;
  onCodeChange?: (code: string) => void;
  height?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const EditorLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full bg-[#1e1e2e]">
    <div className="flex flex-col items-center gap-3 text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      <span className="text-sm">Loading editor…</span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const AdvancedCodeEditor: React.FC<AdvancedCodeEditorProps> = ({
  initialCode,
  initialLanguage = 'javascript',
  roomId,
  onCodeChange,
  height = 'calc(100vh - 80px)',
}) => {
  const {
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
    languages,
    languageConfig,
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
    handleEditorMount,
  } = useCodeEditor({ initialCode, initialLanguage, roomId, onCodeChange });

  // Insert suggestion text into editor via code state
  const handleSuggestionSelect = (suggestion: CompletionSuggestion) => {
    const insertText = suggestion.insertText.replace(/\$\d+/g, '');
    setCode(code + insertText);
  };

  const isDark = theme === 'vs-dark';

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden shadow-2xl"
      style={{
        height,
        background: isDark ? '#16161f' : '#f8f8f8',
        border: '1px solid rgba(99,102,241,0.25)',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Top toolbar                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 flex-shrink-0 border-b flex-wrap gap-y-2"
        style={{
          background: isDark ? '#12121a' : '#f0f0f5',
          borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#d1d5db',
        }}
      >
        {/* Left: language selector + language badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            id="language-selector"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            style={{
              background: isDark ? '#1e1e2e' : '#ffffff',
              color: isDark ? '#e2e8f0' : '#1e293b',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
          <SyntaxHighlighter language={language} size="sm" />
        </div>

        {/* Centre: action buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Run */}
          <button
            id="run-code-btn"
            onClick={runCode}
            disabled={isRunning}
            title="Run code"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold
                       bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isRunning ? 'Running…' : 'Run'}
          </button>

          {/* Format */}
          <button
            id="format-code-btn"
            onClick={handleFormat}
            title="Format code"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                       transition-colors"
            style={{
              background: isDark ? '#1e1e2e' : '#e2e8f0',
              color: isDark ? '#a5b4fc' : '#4f46e5',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            <Wand2 className="w-3.5 h-3.5" /> Format
          </button>

          {/* Reset */}
          <button
            id="reset-code-btn"
            onClick={resetCode}
            title="Reset to default"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                       transition-colors"
            style={{
              background: isDark ? '#1e1e2e' : '#e2e8f0',
              color: isDark ? '#94a3b8' : '#64748b',
              border: '1px solid rgba(100,116,139,0.25)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          {/* Font size */}
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={decreaseFontSize}
              title="Decrease font size"
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono w-7 text-center" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              {fontSize}
            </span>
            <button
              onClick={increaseFontSize}
              title="Increase font size"
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: auto-completion + collaborators */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <AutoCompletion
            language={language}
            word={currentWord}
            enabled={autoCompleteEnabled}
            onToggle={toggleAutoComplete}
            onSelect={handleSuggestionSelect}
          />
          <CollaborativeEditing
            collaborators={collaborators}
            roomId={roomId}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Monaco editor                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 min-h-0 relative">
        <Suspense fallback={<EditorLoader />}>
          <MonacoEditor
            language={languageConfig.monacoLanguage}
            theme={theme}
            value={code}
            onChange={(val) => setCode(val ?? '')}
            onMount={handleEditorMount}
            options={{
              fontSize,
              minimap: { enabled: true },
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
              suggestOnTriggerCharacters: autoCompleteEnabled,
              quickSuggestions: autoCompleteEnabled,
              tabSize: languageConfig.id === 'python' ? 4 : 2,
              detectIndentation: false,
              formatOnPaste: true,
              smoothScrolling: true,
              cursorBlinking: 'expand',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
              fontLigatures: true,
            }}
            height="100%"
            width="100%"
          />
        </Suspense>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Status bar                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex items-center justify-between px-3 py-1 text-xs flex-shrink-0"
        style={{
          background: isDark ? '#0d0d14' : '#e2e8f0',
          borderTop: `1px solid ${isDark ? 'rgba(99,102,241,0.15)' : '#d1d5db'}`,
          color: isDark ? '#64748b' : '#94a3b8',
        }}
      >
        <div className="flex items-center gap-3">
          <span>.{languageConfig.extension}</span>
          {validationErrors.length > 0 ? (
            <span className="flex items-center gap-1 text-red-400">
              <XCircle className="w-3 h-3" />
              {validationErrors.length} issue{validationErrors.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle className="w-3 h-3" /> OK
            </span>
          )}
        </div>
        <span>
          Ln {1} · UTF-8 · {theme === 'vs-dark' ? 'Dark' : 'Light'}
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Output panel                                                        */}
      {/* ------------------------------------------------------------------ */}
      {output && (
        <div
          className="flex-shrink-0 border-t"
          style={{
            background: isDark ? '#0a0a12' : '#f1f5f9',
            borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#d1d5db',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {/* Output header */}
          <div
            className="flex items-center justify-between px-3 py-1.5 border-b text-xs font-medium sticky top-0"
            style={{
              background: isDark ? '#12121a' : '#e8edf3',
              borderColor: isDark ? 'rgba(99,102,241,0.2)' : '#d1d5db',
            }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}>
                Output
              </span>
              {/* Exit code badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  output.exitCode === 0
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400'
                }`}
              >
                exit {output.exitCode}
              </span>
              <span className="text-gray-500">{output.executionTimeMs}ms</span>
            </div>
            <button
              onClick={clearOutput}
              title="Clear output"
              className="hover:text-gray-300 text-gray-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* stdout */}
          {output.stdout && (
            <pre
              className="px-4 py-3 text-sm font-mono whitespace-pre-wrap leading-relaxed"
              style={{ color: isDark ? '#86efac' : '#166534' }}
            >
              {output.stdout}
            </pre>
          )}

          {/* stderr */}
          {output.stderr && (
            <pre
              className="px-4 py-2 text-sm font-mono whitespace-pre-wrap leading-relaxed"
              style={{ color: isDark ? '#fca5a5' : '#991b1b' }}
            >
              {output.stderr}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
