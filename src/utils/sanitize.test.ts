import { describe, expect, test } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml iframe handling', () => {
  test('strips non-YouTube iframe', () => {
    const html = '<iframe src="https://evil.com"></iframe>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('iframe');
  });

  test('allows YouTube nocookie iframe with allowfullscreen', () => {
    const html =
      '<iframe src="https://www.youtube-nocookie.com/embed/abc" allowfullscreen></iframe>';
    const result = sanitizeHtml(html);
    // src should remain
    expect(result).toContain('src="https://www.youtube-nocookie.com/embed/abc"');
    // allowfullscreen should be present (may be normalized)
    expect(result).toMatch(/allowfullscreen(?:="")?/);
  });
});
