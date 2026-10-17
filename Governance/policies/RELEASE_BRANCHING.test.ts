/**
 * Regression tests for the Release Branching Policy
 * (Governance/policies/RELEASE_BRANCHING.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * the branching model, the cut and stabilization steps, and the backport flow.
 * These tests pin those guarantees to the checked-in document so they cannot
 * silently regress, and they keep the document consistent with the rest of
 * `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'RELEASE_BRANCHING.md');
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

describe('RELEASE_BRANCHING policy document structure', () => {
  it('is titled "Release Branching Policy"', () => {
    expect(policy.startsWith('# Release Branching Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Branching Model',
      'Cut and Stabilization',
      'Backport Flow',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Branching Model');
    expect(sections).toContain('Cut and Stabilization');
    expect(sections).toContain('Backport Flow');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('branching model guarantees', () => {
  const body = sectionBody('Branching Model');

  it('treats main as the integration branch', () => {
    expect(body).toContain('integration branch');
  });

  it('names release branches with the release-v prefix', () => {
    expect(body).toContain('release-v1.4');
  });

  it('keeps feature work off a release branch', () => {
    expect(body).toContain('never routine feature work');
  });
});

describe('cut and stabilization guarantees', () => {
  const body = sectionBody('Cut and Stabilization');

  it('opens stabilization when the branch is cut', () => {
    expect(body).toContain('stabilization');
    expect(body).toContain('cutting a release branch');
  });

  it('limits stabilization changes to release-safety work', () => {
    expect(body).toContain('security fixes');
    expect(body).toContain('release-blocking');
  });

  it('merges or cherry-picks fixes back to main', () => {
    expect(body).toContain('cherry-picked');
  });

  it('tags a release only after checks pass', () => {
    expect(body).toContain('tagged only after');
  });
});

describe('backport flow guarantees', () => {
  const body = sectionBody('Backport Flow');

  it('starts a fix on main and backports it', () => {
    expect(body).toContain('starts on main');
    expect(body).toContain('backported');
  });

  it('requires a separate pull request against the release branch', () => {
    expect(body).toContain('own pull request');
  });

  it('freezes a branch once the release line is unsupported', () => {
    expect(body).toContain('no longer supported');
    expect(body).toContain('frozen');
  });
});

describe('release branching policy consistency with the rest of Governance', () => {
  it('references versioning, the release cadence, and backporting', () => {
    expect(prose).toContain('versioning.md');
    expect(prose).toContain('release_cadence.md');
    expect(prose).toContain('backport.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of [
      'VERSIONING.md',
      '../processes/RELEASE_CADENCE.md',
      'BACKPORT.md',
    ]) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
