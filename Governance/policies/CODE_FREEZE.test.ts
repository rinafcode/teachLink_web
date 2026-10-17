/**
 * Regression tests for the Code Freeze Policy
 * (Governance/policies/CODE_FREEZE.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * when freezes apply, what is allowed during a freeze, and the exception
 * process. These tests pin those guarantees to the checked-in document so they
 * cannot silently regress, and they keep the document consistent with the rest
 * of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'CODE_FREEZE.md');
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

describe('CODE_FREEZE policy document structure', () => {
  it('is titled "Code Freeze Policy" like every governance document', () => {
    expect(policy.startsWith('# Code Freeze Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'When Freezes Apply',
      'What Is Allowed During a Freeze',
      'Exception Process',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('When Freezes Apply');
    expect(sections).toContain('What Is Allowed During a Freeze');
    expect(sections).toContain('Exception Process');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('when freezes apply guarantees', () => {
  const body = sectionBody('When Freezes Apply');

  it('starts a freeze when a release candidate is cut', () => {
    expect(body).toContain('release candidate is cut');
  });

  it('requires a freeze to be announced with a start and end', () => {
    expect(body).toContain('announced');
    expect(body).toContain('its start, its end');
  });
});

describe('what is allowed during a freeze guarantees', () => {
  const body = sectionBody('What Is Allowed During a Freeze');

  it('allows release-blocking and security fixes', () => {
    expect(body).toContain('block the release');
    expect(body).toContain('security fixes');
  });

  it('defers feature work until the freeze is lifted', () => {
    expect(body).toContain('feature work');
    expect(body).toContain('wait until the freeze is lifted');
  });

  it('still requires approvals and checks during a freeze', () => {
    expect(body).toContain('required');
    expect(body).toContain('approvals and checks');
  });
});

describe('exception process guarantees', () => {
  const body = sectionBody('Exception Process');

  it('requests an exception on the pull request with a risk statement', () => {
    expect(body).toContain('requested on the pull request');
    expect(body).toContain('risk');
  });

  it('records granted exceptions with the approver', () => {
    expect(body).toContain('recorded on the pull request');
  });

  it('never waives a required check', () => {
    expect(body).toContain('never waives a required check');
  });
});

describe('code freeze policy consistency with the rest of Governance', () => {
  it('references the hotfix process for user-affecting faults', () => {
    expect(prose).toContain('hotfix.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['../processes/HOTFIX.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
