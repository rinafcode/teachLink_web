/**
 * Regression tests for the Git Tagging Policy
 * (Governance/policies/TAGGING.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * the tag naming convention, who may tag, and the signing requirement. These
 * tests pin those guarantees to the checked-in document so they cannot
 * silently regress, and they keep the document consistent with the rest of
 * `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'TAGGING.md');
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

describe('TAGGING policy document structure', () => {
  it('is titled "Git Tagging Policy" like every governance document', () => {
    expect(policy.startsWith('# Git Tagging Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Tag Naming Convention',
      'Who May Tag',
      'Signing Requirement',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Tag Naming Convention');
    expect(sections).toContain('Who May Tag');
    expect(sections).toContain('Signing Requirement');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('tag naming convention guarantees', () => {
  const body = sectionBody('Tag Naming Convention');

  it('requires annotated release tags with a versioned name', () => {
    expect(body).toContain('annotated');
    expect(body).toContain('v1.4.0');
  });

  it('defines pre-release naming', () => {
    expect(body).toContain('pre-releases');
    expect(body).toContain('rc.1');
  });

  it('forbids moving a published tag', () => {
    expect(body).toContain('never moves once it is pushed');
  });

  it('reserves lightweight tags for scratch work', () => {
    expect(body).toContain('lightweight tags');
  });
});

describe('who may tag guarantees', () => {
  const body = sectionBody('Who May Tag');

  it('limits release tagging to maintainers and the release manager', () => {
    expect(body).toContain('maintainers');
    expect(body).toContain('release manager');
  });

  it('allows automation only under a maintainer-triggered release', () => {
    expect(body).toContain('automation may create a tag');
  });
});

describe('tag signing guarantees', () => {
  const body = sectionBody('Signing Requirement');

  it('requires release tags to be signed', () => {
    expect(body).toContain('signed');
  });

  it('rejects unsigned release tags', () => {
    expect(body).toContain('unsigned release tags are rejected');
  });

  it('treats an unverifiable signature as absent', () => {
    expect(body).toContain('cannot be verified');
  });
});

describe('tagging policy consistency with the rest of Governance', () => {
  it('references versioning and the release cadence', () => {
    expect(prose).toContain('versioning.md');
    expect(prose).toContain('release_cadence.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of [
      'VERSIONING.md',
      '../processes/RELEASE_CADENCE.md',
    ]) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
