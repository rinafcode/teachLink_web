/**
 * Unit Tests for codeUtils
 */
import { describe, it, expect } from 'vitest';
import {
  getAllLanguages,
  getLanguageConfig,
  getAutoCompletionSuggestions,
  formatCode,
  validateCode,
  simulateCodeExecution,
} from '../codeUtils';

// ---------------------------------------------------------------------------
// getAllLanguages
// ---------------------------------------------------------------------------
describe('getAllLanguages', () => {
  it('returns an array of at least 5 languages', () => {
    const langs = getAllLanguages();
    expect(Array.isArray(langs)).toBe(true);
    expect(langs.length).toBeGreaterThanOrEqual(5);
  });

  it('each language has required fields', () => {
    getAllLanguages().forEach((lang) => {
      expect(lang).toHaveProperty('id');
      expect(lang).toHaveProperty('label');
      expect(lang).toHaveProperty('extension');
      expect(lang).toHaveProperty('monacoLanguage');
      expect(lang).toHaveProperty('color');
      expect(lang).toHaveProperty('defaultCode');
    });
  });
});

// ---------------------------------------------------------------------------
// getLanguageConfig
// ---------------------------------------------------------------------------
describe('getLanguageConfig', () => {
  it('returns the correct config for a known language', () => {
    const config = getLanguageConfig('javascript');
    expect(config.id).toBe('javascript');
    expect(config.label).toBe('JavaScript');
    expect(config.monacoLanguage).toBe('javascript');
  });

  it('returns the correct config for python', () => {
    const config = getLanguageConfig('python');
    expect(config.id).toBe('python');
    expect(config.extension).toBe('py');
  });

  it('falls back to the first language for an unknown language id', () => {
    const config = getLanguageConfig('cobol');
    expect(config).toBeDefined();
    expect(typeof config.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// getAutoCompletionSuggestions
// ---------------------------------------------------------------------------
describe('getAutoCompletionSuggestions', () => {
  it('returns an array for a known language', () => {
    const suggestions = getAutoCompletionSuggestions('javascript');
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('filters suggestions by prefix (case-insensitive)', () => {
    const suggestions = getAutoCompletionSuggestions('javascript', 'con');
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach((s) => {
      expect(s.label.toLowerCase()).toMatch(/^con/);
    });
  });

  it('returns empty array when prefix matches nothing', () => {
    const suggestions = getAutoCompletionSuggestions('javascript', 'zzz_no_match');
    expect(suggestions).toHaveLength(0);
  });

  it('each suggestion has required fields', () => {
    const suggestions = getAutoCompletionSuggestions('python');
    suggestions.forEach((s) => {
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('kind');
      expect(s).toHaveProperty('detail');
      expect(s).toHaveProperty('insertText');
    });
  });

  it('falls back gracefully for an unknown language', () => {
    const suggestions = getAutoCompletionSuggestions('brainfuck');
    expect(Array.isArray(suggestions)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatCode
// ---------------------------------------------------------------------------
describe('formatCode', () => {
  it('trims trailing whitespace from each line', () => {
    const code = 'const x = 1;   \nconst y = 2;  ';
    const result = formatCode('javascript', code);
    result.split('\n').forEach((line) => {
      expect(line).not.toMatch(/ +$/);
    });
  });

  it('collapses multiple consecutive blank lines into one', () => {
    const code = 'a\n\n\n\nb';
    const result = formatCode('javascript', code);
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('ensures a single trailing newline', () => {
    const code = 'const x = 1;';
    const result = formatCode('javascript', code);
    expect(result.endsWith('\n')).toBe(true);
  });

  it('converts tabs to 4 spaces for python', () => {
    const code = '\tprint("hello")';
    const result = formatCode('python', code);
    expect(result.startsWith('    ')).toBe(true);
  });

  it('returns empty string unchanged', () => {
    expect(formatCode('javascript', '')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// validateCode
// ---------------------------------------------------------------------------
describe('validateCode', () => {
  it('returns invalid for empty code', () => {
    const result = validateCode('javascript', '   ');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns valid for normal javascript', () => {
    const result = validateCode('javascript', 'const x = 1;\nconsole.log(x);');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects eval() usage in javascript', () => {
    const result = validateCode('javascript', 'eval("alert(1)")');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/eval/i);
  });

  it('detects tab indentation in python', () => {
    const result = validateCode('python', '\tprint("hi")');
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toMatch(/tab/i);
  });

  it('returns valid structure on valid python', () => {
    const result = validateCode('python', 'print("hello")');
    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('errors');
  });
});

// ---------------------------------------------------------------------------
// simulateCodeExecution
// ---------------------------------------------------------------------------
describe('simulateCodeExecution', () => {
  it('returns a valid ExecutionResult shape', () => {
    const result = simulateCodeExecution('javascript', 'console.log("hi")');
    expect(result).toHaveProperty('stdout');
    expect(result).toHaveProperty('stderr');
    expect(result).toHaveProperty('exitCode');
    expect(result).toHaveProperty('executionTimeMs');
  });

  it('exits with code 1 for empty code', () => {
    const result = simulateCodeExecution('javascript', '   ');
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBeTruthy();
  });

  it('extracts the string from console.log for javascript', () => {
    const result = simulateCodeExecution('javascript', 'console.log("Hello, World!")');
    expect(result.stdout).toContain('Hello, World!');
    expect(result.exitCode).toBe(0);
  });

  it('extracts the string from print() for python', () => {
    const result = simulateCodeExecution('python', 'print("Hello Python")');
    expect(result.stdout).toContain('Hello Python');
    expect(result.exitCode).toBe(0);
  });

  it('returns a non-negative executionTimeMs', () => {
    const result = simulateCodeExecution('go', 'package main\nfunc main() {}');
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
