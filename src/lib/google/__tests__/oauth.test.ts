import { describe, expect, it } from 'vitest';
import { generateState, validateState } from '../oauth';

describe('Google OAuth utilities', () => {
  it('generates a cryptographically random state value', () => {
    const state1 = generateState();
    const state2 = generateState();

    expect(state1).toBeTruthy();
    expect(state2).toBeTruthy();
    expect(state1).not.toBe(state2);
    expect(state1.length).toBeGreaterThan(32);
  });

  it('validates a matching OAuth state and rejects mismatches', () => {
    const validState = generateState();

    expect(validateState(validState, validState)).toBe(true);
    expect(validateState(validState, `${validState}tampered`)).toBe(false);
    expect(validateState(undefined, validState)).toBe(false);
    expect(validateState(validState, null)).toBe(false);
  });
});
