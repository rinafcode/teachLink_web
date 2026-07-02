import { describe, expect, it } from 'vitest';
import {
  getPortfolioSummary,
  isSafePortfolioUrl,
  normalizePortfolioItems,
} from '../portfolioManagement';

describe('portfolioManagement', () => {
  it('accepts http and https portfolio links only', () => {
    expect(isSafePortfolioUrl('https://example.com/work')).toBe(true);
    expect(isSafePortfolioUrl('http://example.com/work')).toBe(true);
    expect(isSafePortfolioUrl('javascript:alert(1)')).toBe(false);
    expect(isSafePortfolioUrl('not-a-url')).toBe(false);
  });

  it('normalizes, de-duplicates, and filters portfolio evidence', () => {
    const items = normalizePortfolioItems([
      {
        id: '1',
        title: '  Capstone  ',
        url: 'https://example.com/capstone',
        type: 'project',
      },
      {
        id: '2',
        title: 'Duplicate',
        url: 'https://example.com/capstone',
        type: 'project',
      },
      {
        id: '3',
        title: 'Unsafe',
        url: 'javascript:alert(1)',
        type: 'repository',
      },
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Capstone');
  });

  it('summarizes portfolio attachments for accessible review labels', () => {
    expect(getPortfolioSummary([])).toBe('No portfolio evidence attached');
    expect(
      getPortfolioSummary([
        { id: '1', title: 'Demo', url: 'https://example.com', type: 'project' },
        { id: '2', title: 'Repo', url: 'https://github.com/example/repo', type: 'repository' },
      ]),
    ).toBe('2 portfolio items attached');
  });
});
