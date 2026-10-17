/**
 * Regression tests for the CODEOWNERS Policy
 * (Governance/policies/CODEOWNERS.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * how ownership is assigned, what code-owner review implies, and how ownership
 * is kept current. These tests pin those guarantees to the checked-in document
 * so they cannot silently regress, and they keep the document consistent with
 * the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'CODEOWNERS.md');
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

describe('CODEOWNERS policy document structure', () => {
  it('is titled "CODEOWNERS Policy" like every governance document', () => {
    expect(policy.startsWith('# CODEOWNERS Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Ownership Assignment',
      'Required-Review Implications',
      'Update Process',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Ownership Assignment');
    expect(sections).toContain('Required-Review Implications');
    expect(sections).toContain('Update Process');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('ownership assignment guarantees', () => {
  const body = sectionBody('Ownership Assignment');

  it('requires an owner for every top-level area', () => {
    expect(body).toContain('top-level area');
    expect(body).toContain('at least one owner');
  });

  it('resolves overlapping entries to the most specific pattern', () => {
    expect(body).toContain('most specific pattern wins');
  });

  it('treats an unowned path as a gap', () => {
    expect(body).toContain('no owner is treated as a gap');
  });
});

describe('required-review guarantees', () => {
  const body = sectionBody('Required-Review Implications');

  it('needs an owner approval for an owned path', () => {
    expect(body).toContain('code-owner review');
    expect(body).toContain('approval from one of that path');
  });

  it('counts the owner approval as independent review', () => {
    expect(body).toContain('independent review');
  });

  it('cannot bypass checks or lower the approval floor', () => {
    expect(body).toContain('cannot');
    expect(body).toContain('bypass required checks');
    expect(body).toContain('approval floor');
  });
});

describe('update process guarantees', () => {
  const body = sectionBody('Update Process');

  it('requires a maintainer and current-owner approval', () => {
    expect(body).toContain('approval from a maintainer');
    expect(body).toContain('current owner');
  });

  it('reviews ownership at least every six months', () => {
    expect(body).toContain('at least every six months');
  });
});

describe('CODEOWNERS policy consistency with the rest of Governance', () => {
  it('references the review and approval requirements policies', () => {
    expect(prose).toContain('review_policy.md');
    expect(prose).toContain('approval_requirements.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['REVIEW_POLICY.md', 'APPROVAL_REQUIREMENTS.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
