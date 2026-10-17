/**
 * Regression tests for the CI/CD Governance Policy
 * (Governance/policies/CICD_GOVERNANCE.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * who may change pipelines, the secret and permission rules, and the
 * required-check policy. These tests pin those guarantees to the checked-in
 * document so they cannot silently regress, and they keep the document
 * consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'CICD_GOVERNANCE.md');
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

describe('CICD_GOVERNANCE policy document structure', () => {
  it('is titled "CI/CD Governance Policy" like every governance document', () => {
    expect(policy.startsWith('# CI/CD Governance Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Who May Change Pipelines',
      'Secret and Permission Rules',
      'Required-Check Policy',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Who May Change Pipelines');
    expect(sections).toContain('Secret and Permission Rules');
    expect(sections).toContain('Required-Check Policy');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('who may change pipelines guarantees', () => {
  const body = sectionBody('Who May Change Pipelines');

  it('requires a maintainer responsible for CI to approve', () => {
    expect(body).toContain('maintainer responsible for ci');
  });

  it('requires a security approval for secret or permission changes', () => {
    expect(body).toContain('additional approval');
    expect(body).toContain('security');
  });

  it('does not let contributors merge pipeline changes', () => {
    expect(body).toContain('may not merge them');
  });
});

describe('secret and permission rule guarantees', () => {
  const body = sectionBody('Secret and Permission Rules');

  it('scopes secrets and permissions to the job that uses them', () => {
    expect(body).toContain('smallest set of secrets');
  });

  it('keeps secrets out of the repository and the logs', () => {
    expect(body).toContain('never in the repository');
    expect(body).toContain('not printed to logs');
  });

  it('withholds secrets from pull requests opened from forks', () => {
    expect(body).toContain('forks do not receive secrets');
  });
});

describe('required-check guarantees', () => {
  const body = sectionBody('Required-Check Policy');

  it('names the checks that gate a merge', () => {
    expect(body).toContain('type-check');
    expect(body).toContain('lint');
    expect(body).toContain('build');
    expect(body).toContain('test');
  });

  it('does not let a check be removed without an approval', () => {
    expect(body).toContain('not removed');
  });

  it('blocks the merge on a skipped or missing check', () => {
    expect(body).toContain('block the merge');
  });
});

describe('CI/CD policy consistency with the rest of Governance', () => {
  it('references the approval requirements policy', () => {
    expect(prose).toContain('approval_requirements.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['APPROVAL_REQUIREMENTS.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
