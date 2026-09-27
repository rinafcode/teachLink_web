/**
 * Regression tests for the Code of Conduct Enforcement Ladder
 * (Governance/COC_ENFORCEMENT.md).
 *
 * The document is governance, but it makes concrete, enforceable
 * guarantees: the graduated enforcement steps, the criteria for each
 * step, and who may apply them. These tests pin those guarantees to
 * the checked-in document so they cannot silently regress (for
 * example, an edit that reorders the ladder or lets one maintainer
 * issue a permanent ban fails CI), and they keep the document
 * consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'COC_ENFORCEMENT.md');
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

/** Every "### N. Step" heading, in order. */
const steps = [...policy.matchAll(/^### \d+\. (.+)$/gm)].map((match) => match[1]);

/** Extract the body of a heading (text up to the next heading of that level or higher). */
function headingBody(heading: string): string {
  const start = policy.indexOf(`${heading}\n`);
  expect(start, `heading "${heading}" is missing`).toBeGreaterThanOrEqual(0);
  const level = heading.split(' ')[0];
  const pattern = new RegExp(`\\n#{2,${level.length}} `, 'g');
  pattern.lastIndex = start + 1;
  const next = pattern.exec(policy)?.index ?? -1;
  const body = next === -1 ? policy.slice(start) : policy.slice(start, next);
  return plainProse(body);
}

describe('COC_ENFORCEMENT document structure', () => {
  it('is titled "Code of Conduct Enforcement Ladder"', () => {
    expect(policy.startsWith('# Code of Conduct Enforcement Ladder\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Enforcement Steps',
      'Who Applies Enforcement',
      'Decision Record',
      'Ownership and Review',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('graduated enforcement step guarantees', () => {
  it('keeps the four steps in graduated order', () => {
    expect(steps).toEqual(['Correction', 'Warning', 'Temporary Suspension', 'Permanent Ban']);
  });

  it('starts at the lowest fitting step and escalates on repetition', () => {
    const body = headingBody('## Enforcement Steps');
    expect(body).toContain('lowest step that fits');
    expect(body).toContain('moves up when behavior repeats');
  });

  it.each(steps.map((step, index) => `### ${index + 1}. ${step}`))(
    '"%s" defines its criteria, action, and who applies it',
    (heading) => {
      const body = headingBody(heading);
      expect(body).toContain('criteria:');
      expect(body).toContain('action:');
      expect(body).toContain('applied by:');
    },
  );
});

describe('step criteria and authority guarantees', () => {
  it('lets any maintainer issue a correction for a first, minor breach', () => {
    const body = headingBody('### 1. Correction');
    expect(body).toContain('first, minor breach');
    expect(body).toContain('applied by: any maintainer');
  });

  it('issues a warning for a repeated breach, with a second maintainer informed', () => {
    const body = headingBody('### 2. Warning');
    expect(body).toContain('repeated minor breach');
    expect(body).toContain('second maintainer informed');
  });

  it('requires two maintainers to agree on a temporary suspension', () => {
    const body = headingBody('### 3. Temporary Suspension');
    expect(body).toContain('serious breach');
    expect(body).toContain('applied by: two maintainers in agreement');
  });

  it('requires a majority of active maintainers for a permanent ban', () => {
    const body = headingBody('### 4. Permanent Ban');
    expect(body).toContain('pattern of breaches');
    expect(body).toContain('applied by: a majority of active maintainers');
  });
});

describe('who-applies-enforcement guarantees', () => {
  const body = headingBody('## Who Applies Enforcement');

  it('assigns enforcement to maintainers', () => {
    expect(body).toContain('maintainers apply enforcement');
  });

  it('requires recusal on a conflict of interest', () => {
    expect(body).toContain('steps aside');
  });

  it('does not exempt maintainers from enforcement', () => {
    expect(body).toContain('maintainers are not exempt');
  });

  it('allows interim action to stop ongoing harm', () => {
    expect(body).toContain('interim action');
  });
});

describe('decision record guarantees', () => {
  it('records each decision and communicates the appeal route', () => {
    const body = headingBody('## Decision Record');
    expect(body).toContain('private conduct record');
    expect(body).toContain('reasoning');
    expect(body).toContain('appeal route');
  });
});

describe('policy consistency with the governance folder', () => {
  it('mentions the governance-folder-only rule for changes to this ladder', () => {
    const body = headingBody('## Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it.each([
    'CODE_OF_CONDUCT.md',
    'COC_REPORTING.md',
    'COC_APPEALS.md',
    'policies/MODERATION.md',
    'policies/CONFLICT_OF_INTEREST.md',
    'roles/MAINTAINER.md',
  ])('links to %s, which exists', (relativePath) => {
    expect(prose).toContain(`governance/${relativePath.toLowerCase()}`);
    expect(() => readGovernanceDoc(relativePath)).not.toThrow();
  });
});
