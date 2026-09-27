/**
 * Regression tests for the Stale Issue Policy
 * (Governance/policies/STALE_ISSUES.md).
 *
 * The policy is documentation, but it makes concrete, enforceable
 * guarantees: a staleness threshold, a warning-then-close sequence,
 * and a reopen path. These tests pin those guarantees to the
 * checked-in document so they cannot silently regress (for example,
 * an edit that drops the threshold or the reopen path fails CI),
 * and they keep the document consistent with the rest of Governance.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'STALE_ISSUES.md');
const policy = readFileSync(POLICY_PATH, 'utf8');

/** Strip Markdown syntax so keyword assertions match prose, not formatting. */
function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1') // inline code keeps its text
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold keeps its text
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2') // links keep text and target
    .replace(/\s+/g, ' ') // line wrapping must not affect prose matching
    .toLowerCase();
}

const prose = plainProse(policy);

/** Every "## Heading" in the document, in order. */
const sections = [...policy.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

/** Extract the body of a single "## Section" (text up to the next heading). */
function sectionBody(title: string): string {
  const start = policy.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = policy.indexOf('\n## ', start + 1);
  const body = next === -1 ? policy.slice(start) : policy.slice(start, next);
  return plainProse(body);
}

describe('STALE_ISSUES policy document structure', () => {
  it('is titled "Stale Issue Policy" like every governance document', () => {
    expect(policy.startsWith('# Stale Issue Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Staleness Threshold',
      'Warning and Closing Steps',
      'Reopen Path',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Staleness Threshold');
    expect(sections).toContain('Warning and Closing Steps');
    expect(sections).toContain('Reopen Path');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('staleness threshold guarantees', () => {
  const body = sectionBody('Staleness Threshold');

  it('defines the 60 calendar days threshold with no activity', () => {
    expect(body).toContain('60 calendar days');
    expect(body).toContain('no activity');
  });

  it('defines what counts as activity and excludes bot-only noise', () => {
    expect(body).toContain('human');
    expect(body).toContain('bot comments alone do not reset');
  });

  it('lists exempt issues that are never marked stale by automation', () => {
    expect(body).toContain('exempt');
    expect(body).toContain('never marked stale');
    expect(body).toContain('security');
    expect(body).toContain('priority: high');
  });
});

describe('warning and closing guarantees', () => {
  const body = sectionBody('Warning and Closing Steps');

  it('requires a warning with the stale label before any close', () => {
    expect(body).toContain('warning');
    expect(body).toContain('triage: stale');
  });

  it('defines a 14 calendar days grace period after the warning', () => {
    expect(body).toContain('14 calendar days');
    expect(body).toContain('grace period');
  });

  it('closes only after the grace period with an auditable comment', () => {
    expect(body).toContain('closing');
    expect(body).toContain('auditable');
    expect(body).toContain('how to reopen');
  });

  it('forbids silent stale transitions', () => {
    expect(body).toContain('never marked stale');
    expect(body).toContain('without the thread comments');
  });
});

describe('reopen path guarantees', () => {
  const body = sectionBody('Reopen Path');

  it('lets any participant reopen via comment or direct reopen', () => {
    expect(body).toContain('reopen');
    expect(body).toContain('commenting');
  });

  it('clears stale state and restarts triage on reopen', () => {
    expect(body).toContain('restarts triage');
    expect(body).toContain('triage: stale');
  });

  it('removes terminal disposition labels on reopen', () => {
    expect(body).toContain('duplicate');
    expect(body).toContain('invalid');
    expect(body).toContain('wontfix');
  });
});

describe('policy consistency with the governance folder', () => {
  it('routes triage and labels to the canonical governance documents', () => {
    expect(prose).toContain('governance/processes/triage.md');
    expect(prose).toContain('governance/label_taxonomy.md');
    expect(() =>
      readFileSync(path.resolve(__dirname, '../processes/TRIAGE.md'), 'utf8'),
    ).not.toThrow();
    expect(() =>
      readFileSync(path.resolve(__dirname, '../README.md'), 'utf8'),
    ).not.toThrow();
  });

  it('mentions the governance-folder-only rule for changes to this policy', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });
});
