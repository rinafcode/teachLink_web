/**
 * Regression tests for the Bot and Automation Policy
 * (Governance/policies/BOT_AUTOMATION.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * the allowed automations, the permissions they may hold, and how they are
 * reviewed and audited. These tests pin those guarantees to the checked-in
 * document so they cannot silently regress, and they keep the document
 * consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'BOT_AUTOMATION.md');
const policy = readFileSync(POLICY_PATH, 'utf8');

/** Resolve a sibling governance document relative to this test file. */
function readGovernanceDoc(relativePath: string): string {
  return readFileSync(path.resolve(__dirname, relativePath), 'utf8');
}

/** Strip Markdown syntax so keyword assertions match prose, not formatting. */
function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1') // inline code keeps its text
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold keeps its text
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2') // links keep text + target
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

describe('BOT_AUTOMATION policy document structure', () => {
  it('is titled "Bot and Automation Policy"', () => {
    expect(policy.startsWith('# Bot and Automation Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Allowed Automations',
      'Permissions',
      'Review and Audit',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Allowed Automations');
    expect(sections).toContain('Permissions');
    expect(sections).toContain('Review and Audit');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('allowed automation guarantees', () => {
  const body = sectionBody('Allowed Automations');

  it('requires a documented purpose and a named human owner', () => {
    expect(body).toContain('documented purpose');
    expect(body).toContain('named human owner');
  });

  it('forbids automations from merging or approving', () => {
    expect(body).toContain('may not merge');
  });

  it('removes an unused automation rather than disabling it', () => {
    expect(body).toContain('removed rather than disabled');
  });
});

describe('permission guarantees', () => {
  const body = sectionBody('Permissions');

  it('grants the least permission a job requires', () => {
    expect(body).toContain('least permission');
  });

  it('never grants administrative permission', () => {
    expect(body).toContain('administrative permission is never granted');
  });

  it('reviews a vendor automation as a third party', () => {
    expect(body).toContain('vendor_risk.md');
  });
});

describe('review and audit guarantees', () => {
  const body = sectionBody('Review and Audit');

  it('reviews every automation at least every six months', () => {
    expect(body).toContain('at least every six months');
  });

  it('keeps automation actions visible in history', () => {
    expect(body).toContain('visible in the');
  });

  it('reassigns or removes an automation with an inactive owner', () => {
    expect(body).toContain('reassigned or removed');
  });
});

describe('bot policy consistency with the rest of Governance', () => {
  it('references the access review and vendor risk policies', () => {
    expect(prose).toContain('access_review.md');
    expect(prose).toContain('vendor_risk.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['ACCESS_REVIEW.md', 'VENDOR_RISK.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
