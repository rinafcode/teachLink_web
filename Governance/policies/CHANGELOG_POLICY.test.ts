/**
 * Regression tests for the Changelog Policy (Governance/policies/CHANGELOG_POLICY.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * a fixed entry format, a closed list of change categories, and a defined set
 * of conditions under which an entry is required. These tests pin those
 * guarantees to the checked-in document so they cannot silently regress (for
 * example, an edit that drops a category or waters down the "always required"
 * rule fails CI), and they keep the document consistent with the rest of
 * `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'CHANGELOG_POLICY.md');
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

describe('CHANGELOG policy document structure', () => {
  it('is titled "Changelog Policy" like every governance document', () => {
    expect(policy.startsWith('# Changelog Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Changelog Format',
      'Change Categories',
      'When Entries Are Required',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Changelog Format');
    expect(sections).toContain('Change Categories');
    expect(sections).toContain('When Entries Are Required');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('changelog format guarantees', () => {
  const body = sectionBody('Changelog Format');

  it('names the changelog file and its location', () => {
    expect(body).toContain('changelog.md');
    expect(body).toContain('repository root');
  });

  it('requires one section per release with a version and date heading', () => {
    expect(body).toContain('one section per release');
    expect(body).toContain('major.minor.patch');
    expect(body).toContain('yyyy-mm-dd');
  });

  it('requires an Unreleased section above the newest release', () => {
    expect(body).toContain('unreleased');
    expect(body).toContain('newest release first');
  });

  it('requires one single-line entry per change', () => {
    expect(body).toContain('one entry per change');
    expect(body).toContain('past tense');
  });

  it('requires breaking changes to be called out with migration guidance', () => {
    expect(body).toContain('breaking');
    expect(body).toContain('migrate');
  });

  it('keeps security entries consistent with the disclosure process', () => {
    expect(body).toContain('security');
    expect(body).toContain('vuln_disclosure.md');
  });
});

describe('change category guarantees', () => {
  const body = sectionBody('Change Categories');

  it('defines the closed list of categories', () => {
    for (const category of [
      'added',
      'changed',
      'deprecated',
      'removed',
      'fixed',
      'security',
      'documentation',
    ]) {
      expect(body, `category "${category}" is missing`).toContain(category);
    }
  });

  it('states that these are the only categories the changelog uses', () => {
    expect(body).toContain('only categories');
  });

  it('routes new categories through the RFC process', () => {
    expect(body).toContain('rfc_process.md');
  });

  it('ties deprecation entries to the deprecation policy', () => {
    expect(body).toContain('deprecation.md');
    expect(body).toContain('replacement');
  });
});

describe('when entries are required', () => {
  const body = sectionBody('When Entries Are Required');

  it('requires an entry for every observable change', () => {
    expect(body).toContain('always required');
    expect(body).toContain('user-facing');
  });

  it('requires the entry in the same pull request as the change', () => {
    expect(body).toContain('same pull request');
  });

  it('defers flagged behaviour until the flag is enabled for users', () => {
    expect(body).toContain('feature flag');
    expect(body).toContain('enabled for users');
  });

  it('exempts internal refactors and test-only changes', () => {
    expect(body).toContain('not required');
    expect(body).toContain('internal refactors');
    expect(body).toContain('test-only');
  });

  it('does not allow a required entry to be omitted', () => {
    expect(body).toContain('never omitted for convenience');
    expect(body).toContain('not merged');
  });
});

describe('changelog policy consistency with the rest of Governance', () => {
  it('references the versioning policy for version numbers', () => {
    expect(prose).toContain('versioning.md');
  });

  it('references the deprecation policy for notice periods', () => {
    expect(prose).toContain('deprecation.md');
  });

  it('references the release checklist for release-time verification', () => {
    expect(prose).toContain('release_checklist.md');
  });

  it('references the vulnerability disclosure process for security entries', () => {
    expect(prose).toContain('vuln_disclosure.md');
  });

  it('references the RFC process for adding a category', () => {
    expect(prose).toContain('rfc_process.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of [
      'VERSIONING.md',
      'DEPRECATION.md',
      '../templates/RELEASE_CHECKLIST.md',
      '../processes/VULN_DISCLOSURE.md',
      '../processes/RFC_PROCESS.md',
    ]) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
