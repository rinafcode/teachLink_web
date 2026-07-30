import { describe, expect, it, vi } from 'vitest';

vi.mock('date-fns/locale', () => {
  throw new Error('date-fns locale barrel should not be imported eagerly');
});

describe('i18nUtils locale loading', () => {
  it('does not depend on the date-fns locale barrel export', async () => {
    const { formatDate } = await import('../i18nUtils');

    const date = new Date('2024-01-02T03:04:05.000Z');
    const formatted = formatDate(date, 'es');

    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});
