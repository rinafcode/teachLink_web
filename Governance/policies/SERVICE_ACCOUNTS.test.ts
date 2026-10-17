/**
 * Regression tests for the Service Account Policy
 * (Governance/policies/SERVICE_ACCOUNTS.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * the information recorded before an account is created, the least-privilege
 * rule, and the review and decommission triggers. These tests pin those
 * guarantees to the checked-in document so they cannot silently regress, and
 * they keep the document consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'SERVICE_ACCOUNTS.md');
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

describe('SERVICE_ACCOUNTS policy document structure', () => {
  it('is titled "Service Account Policy" like every governance document', () => {
    expect(policy.startsWith('# Service Account Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Creating Service Accounts',
      'Least Privilege',
      'Review and Decommission',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Creating Service Accounts');
    expect(sections).toContain('Least Privilege');
    expect(sections).toContain('Review and Decommission');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('service account creation guarantees', () => {
  const body = sectionBody('Creating Service Accounts');

  it('requires a recorded purpose and owner before creation', () => {
    expect(body).toContain('purpose');
    expect(body).toContain('owner');
  });

  it('requires the requested scopes and a review date', () => {
    expect(body).toContain('scopes');
    expect(body).toContain('review date');
  });

  it('requires a retirement plan', () => {
    expect(body).toContain('retirement');
  });
});

describe('least privilege guarantees', () => {
  const body = sectionBody('Least Privilege');

  it('grants the smallest permission set', () => {
    expect(body).toContain('smallest set of permissions');
  });

  it('forbids administrative rights when a scoped role will do', () => {
    expect(body).toContain('administrative');
  });

  it('forbids shared credentials between automations', () => {
    expect(body).toContain('shared credentials');
  });
});

describe('review and decommission guarantees', () => {
  const body = sectionBody('Review and Decommission');

  it('ties the review schedule to the access review policy', () => {
    expect(body).toContain('access_review.md');
  });

  it('lists the decommission triggers', () => {
    expect(body).toContain('automation is removed');
    expect(body).toContain('review is missed');
  });

  it('requires revocation of credentials on decommission', () => {
    expect(body).toContain('revokes the credentials');
  });
});

describe('service account policy consistency with the rest of Governance', () => {
  it('references the access review policy', () => {
    expect(prose).toContain('access_review.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['ACCESS_REVIEW.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
