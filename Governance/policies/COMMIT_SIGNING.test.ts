/**
 * Regression tests for the Commit Signing Policy
 * (Governance/policies/COMMIT_SIGNING.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * the signing requirement, the CI verification rule, and the key-management
 * duties that keep signatures trustworthy. These tests pin those guarantees to
 * the checked-in document so they cannot silently regress, and they keep the
 * document consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'COMMIT_SIGNING.md');
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

describe('COMMIT_SIGNING policy document structure', () => {
  it('is titled "Commit Signing Policy" like every governance document', () => {
    expect(policy.startsWith('# Commit Signing Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Signing Requirement',
      'Verification in CI',
      'Key Management',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Signing Requirement');
    expect(sections).toContain('Verification in CI');
    expect(sections).toContain('Key Management');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('signing requirement guarantees', () => {
  const body = sectionBody('Signing Requirement');

  it('requires a signed commit on every protected branch', () => {
    expect(body).toContain('protected branch');
    expect(body).toContain('signed');
  });

  it('accepts a GPG or SSH key registered to the author', () => {
    expect(body).toContain('gpg or an ssh signing key');
  });

  it('forbids rewriting published history to change signatures', () => {
    expect(body).toContain('rewriting published history');
  });
});

describe('CI verification guarantees', () => {
  const body = sectionBody('Verification in CI');

  it('requires a status check that verifies signatures before merge', () => {
    expect(body).toContain('required status check');
    expect(body).toContain('before the branch may merge');
  });

  it('fails unsigned commits and unverifiable signatures', () => {
    expect(body).toContain('unsigned');
    expect(body).toContain('cannot be verified');
  });

  it('is not bypassable by an approval', () => {
    expect(body).toContain('not bypassable by an approval');
  });
});

describe('key management guarantees', () => {
  const body = sectionBody('Key Management');

  it('forbids sharing a signing key between people', () => {
    expect(body).toContain('never shared between people');
  });

  it('rejects a commit signed with a revoked key', () => {
    expect(body).toContain('revoked key is rejected');
  });

  it('requires contributors to keep keys registered', () => {
    expect(body).toContain('registered');
  });
});

describe('commit signing policy consistency with the rest of Governance', () => {
  it('references the DCO and the code review policy', () => {
    expect(prose).toContain('dco.md');
    expect(prose).toContain('review_policy.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['DCO.md', 'REVIEW_POLICY.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
