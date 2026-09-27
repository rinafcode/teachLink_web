/**
 * Regression tests for the Code of Conduct
 * (Governance/CODE_OF_CONDUCT.md).
 *
 * The document is governance, but it makes concrete, enforceable
 * guarantees: the expected behavior, the unacceptable behavior, and
 * the scope in which the standard applies. These tests pin those
 * guarantees to the checked-in document so they cannot silently
 * regress (for example, an edit that drops harassment from the
 * unacceptable list or exempts maintainers fails CI), and they keep
 * the document consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'CODE_OF_CONDUCT.md');
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

describe('CODE_OF_CONDUCT document structure', () => {
  it('is titled "Code of Conduct"', () => {
    expect(policy.startsWith('# Code of Conduct\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Expected Behavior',
      'Unacceptable Behavior',
      'Reporting and Enforcement',
      'Ownership and Review',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Expected Behavior');
    expect(sections).toContain('Unacceptable Behavior');
    expect(sections).toContain('Scope');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('expected behavior guarantees', () => {
  const body = sectionBody('Expected Behavior');

  it.each(['be respectful', 'be inclusive', 'be constructive', 'respect privacy'])(
    'expects participants to %s',
    (behavior) => {
      expect(body).toContain(behavior);
    },
  );

  it('asks participants to report breaches through the reporting process', () => {
    expect(body).toContain('governance/coc_reporting.md');
  });
});

describe('unacceptable behavior guarantees', () => {
  const body = sectionBody('Unacceptable Behavior');

  it.each([
    'harassment',
    'discrimination',
    'threats',
    'personal attacks',
    'sexualized content',
    'doxxing',
    'retaliation',
  ])('does not accept %s', (behavior) => {
    expect(body).toContain(behavior);
  });

  it('states that the list illustrates the standard rather than limiting it', () => {
    expect(body).toContain('does not limit it');
  });
});

describe('scope guarantees', () => {
  const body = sectionBody('Scope');

  it('applies in all project spaces', () => {
    expect(body).toContain('all project spaces');
  });

  it('applies when officially representing the project', () => {
    expect(body).toContain('officially representing the project');
  });

  it('applies equally to every participant, with no role exemption', () => {
    expect(body).toContain('equally to every participant');
    expect(body).toContain('never exempts anyone');
  });
});

describe('policy consistency with the governance folder', () => {
  it('mentions the governance-folder-only rule for changes to this document', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it.each([
    'COC_REPORTING.md',
    'COC_ENFORCEMENT.md',
    'COC_APPEALS.md',
    'policies/MODERATION.md',
    'roles/MAINTAINER.md',
  ])('links to %s, which exists', (relativePath) => {
    expect(prose).toContain(`governance/${relativePath.toLowerCase()}`);
    expect(() => readGovernanceDoc(relativePath)).not.toThrow();
  });
});
