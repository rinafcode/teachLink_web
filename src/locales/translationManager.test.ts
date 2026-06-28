/**
 * Tests for getTranslation parameter interpolation in translationManager.ts
 *
 * Covers:
 *  - Flat key replacement (regression)
 *  - Nested dot-separated key replacement (bug fix)
 *  - Missing param key warning (bug fix)
 *  - No-params passthrough (regression)
 *  - Multiple placeholders in one template (regression)
 *  - Unknown translation key passthrough (regression)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTranslation } from './translationManager';
import type { Translations } from './types';

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

const translations: Translations = {
  greetings: {
    hello: 'Hello {{name}}',
    nested: 'Hello {{user.name}}',
    deepNested: 'Hello {{user.profile.displayName}}',
    multi: 'Hello {{user.name}}, you have {{count}} messages',
    plain: 'No placeholders here',
  },
};

// ---------------------------------------------------------------------------
// Helper to spy on console.warn
// ---------------------------------------------------------------------------

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// Regression: flat key replacement still works
// ---------------------------------------------------------------------------

describe('flat key replacement (regression)', () => {
  it('replaces a simple flat placeholder', () => {
    const result = getTranslation(translations, 'greetings.hello', { name: 'Alice' });
    expect(result).toBe('Hello Alice');
  });

  it('does not warn when flat key is present', () => {
    getTranslation(translations, 'greetings.hello', { name: 'Alice' });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug fix: nested dot-separated key replacement
// ---------------------------------------------------------------------------

describe('nested dot-separated key replacement (bug fix)', () => {
  it('resolves a two-level nested key', () => {
    const result = getTranslation(translations, 'greetings.nested', {
      user: { name: 'Alice' },
    });
    expect(result).toBe('Hello Alice');
  });

  it('resolves a three-level nested key', () => {
    const result = getTranslation(translations, 'greetings.deepNested', {
      user: { profile: { displayName: 'Alice Wonder' } },
    });
    expect(result).toBe('Hello Alice Wonder');
  });

  it('does not warn when nested key resolves successfully', () => {
    getTranslation(translations, 'greetings.nested', { user: { name: 'Alice' } });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Bug fix: missing interpolation key warns and leaves placeholder visible
// ---------------------------------------------------------------------------

describe('missing interpolation key (bug fix)', () => {
  it('leaves the placeholder in the output when nested key is missing', () => {
    const result = getTranslation(translations, 'greetings.nested', {
      user: {},
    });
    expect(result).toBe('Hello {{user.name}}');
  });

  it('emits a console.warn mentioning the missing key path', () => {
    getTranslation(translations, 'greetings.nested', { user: {} });
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain('user.name');
  });

  it('leaves the placeholder when the top-level param object is missing the key', () => {
    const result = getTranslation(translations, 'greetings.hello', {});
    expect(result).toBe('Hello {{name}}');
  });

  it('emits a console.warn for a missing flat key', () => {
    getTranslation(translations, 'greetings.hello', {});
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain('name');
  });
});

// ---------------------------------------------------------------------------
// Regression: no params → raw string returned unchanged
// ---------------------------------------------------------------------------

describe('no params passthrough (regression)', () => {
  it('returns the template string unchanged when params is undefined', () => {
    const result = getTranslation(translations, 'greetings.nested');
    expect(result).toBe('Hello {{user.name}}');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns a plain string unchanged when there are no placeholders', () => {
    const result = getTranslation(translations, 'greetings.plain');
    expect(result).toBe('No placeholders here');
  });
});

// ---------------------------------------------------------------------------
// Regression: multiple placeholders resolved in a single pass
// ---------------------------------------------------------------------------

describe('multiple placeholders in one template (regression)', () => {
  it('replaces all placeholders including nested and flat in one pass', () => {
    const result = getTranslation(translations, 'greetings.multi', {
      user: { name: 'Alice' },
      count: 5,
    });
    expect(result).toBe('Hello Alice, you have 5 messages');
  });

  it('warns once per missing placeholder when multiple are absent', () => {
    getTranslation(translations, 'greetings.multi', {});
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Regression: unknown translation key returns key unchanged
// ---------------------------------------------------------------------------

describe('unknown translation key passthrough (regression)', () => {
  it('returns the key string when the translation path does not exist', () => {
    const result = getTranslation(translations, 'greetings.nonExistent', { name: 'Alice' });
    expect(result).toBe('greetings.nonExistent');
  });
});
