import { describe, it, expect } from 'vitest';
import { buildExportEnvelope, parseExportedSettings } from './export-import';
import { createDefaultSettings } from './types';

describe('settings export-import', () => {
  it('exports and parses a canonical envelope', () => {
    const defaults = createDefaultSettings();
    const env = buildExportEnvelope(defaults, Date.now());
    const parsed = parseExportedSettings(env);
    expect('error' in parsed).toBe(false);
    if ('error' in parsed) return;
    expect(parsed.theme).toBe(defaults.theme);
  });

  it('reports invalid imports', () => {
    const r = parseExportedSettings(null);
    expect(r).toEqual({ error: expect.any(String) });
    expect('error' in r && typeof r.error === 'string').toBe(true);
  });
});
