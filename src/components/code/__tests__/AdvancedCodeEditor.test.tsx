import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const { editorRenders, useCodeEditorMock } = vi.hoisted(() => ({
  editorRenders: [] as Array<{ options: unknown; value?: string }>,
  useCodeEditorMock: vi.fn(),
}));

vi.mock('next/dynamic', () => ({
  default:
    () =>
    ({
      onChange,
      options,
      value,
    }: {
      onChange?: (value?: string) => void;
      options?: unknown;
      value?: string;
    }) => {
      editorRenders.push({ options, value });

      return (
        <button data-testid="monaco-editor" onClick={() => onChange?.(`${value} updated`)}>
          Editor
        </button>
      );
    },
}));

vi.mock('@/hooks/useCodeEditor', () => ({
  useCodeEditor: useCodeEditorMock,
}));

vi.mock('../SyntaxHighlighter', () => ({
  SyntaxHighlighter: () => null,
}));

vi.mock('../AutoCompletion', () => ({
  AutoCompletion: () => null,
}));

vi.mock('../CollaborativeEditing', () => ({
  CollaborativeEditing: () => null,
}));

import { AdvancedCodeEditor } from '../AdvancedCodeEditor';

const languageConfig = {
  id: 'javascript',
  label: 'JavaScript',
  extension: 'js',
  monacoLanguage: 'javascript',
};

describe('AdvancedCodeEditor', () => {
  beforeEach(() => {
    editorRenders.length = 0;
    useCodeEditorMock.mockImplementation(() => {
      const [code, setCode] = React.useState('const value = 1;');
      const [fontSize, setFontSize] = React.useState(14);

      return {
        code,
        language: 'javascript',
        theme: 'vs-dark',
        fontSize,
        isRunning: false,
        output: null,
        validationErrors: [],
        collaborators: [],
        isCollaborationConnected: false,
        autoCompleteEnabled: true,
        currentWord: '',
        languages: [languageConfig],
        languageConfig,
        setCode,
        setLanguage: vi.fn(),
        toggleTheme: vi.fn(),
        increaseFontSize: () => setFontSize((size) => size + 1),
        decreaseFontSize: () => setFontSize((size) => size - 1),
        runCode: vi.fn(),
        handleFormat: vi.fn(),
        resetCode: vi.fn(),
        clearOutput: vi.fn(),
        toggleAutoComplete: vi.fn(),
        handleEditorMount: vi.fn(),
      };
    });
  });

  it('keeps options stable for content changes and updates them for editor settings', () => {
    render(<AdvancedCodeEditor />);

    const initialOptions = editorRenders.at(-1)?.options;

    fireEvent.click(screen.getByTestId('monaco-editor'));

    expect(editorRenders.at(-1)?.value).toBe('const value = 1; updated');
    expect(editorRenders.at(-1)?.options).toBe(initialOptions);

    fireEvent.click(screen.getByTitle('Increase font size'));

    const resizedOptions = editorRenders.at(-1)?.options as { fontSize?: number };
    expect(resizedOptions).not.toBe(initialOptions);
    expect(resizedOptions.fontSize).toBe(15);
  });
});
