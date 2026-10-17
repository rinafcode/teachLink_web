/**
 * Regression tests for the Patch Management Policy
 * (Governance/policies/PATCH_MANAGEMENT.md).
 *
 * The document is governance, but it makes concrete, enforceable
 * guarantees: the patch cadence, the deadline per severity level, and
 * the emergency-patch path. These tests pin those guarantees to the
 * checked-in document, and check that every deadline still matches
 * the severity rubric and the security policy so they cannot drift apart.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'PATCH_MANAGEMENT.md');
const policy = readFileSync(POLICY_PATH, 'utf8');

/** Read a document relative to the Governance folder. */
function readGovernanceDoc(relativePath: string): string {
  return readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

/** Strip Markdown syntax so keyword assertions match prose, not formatting. */
function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const prose = plainProse(policy);
const rubric = plainProse(readGovernanceDoc('SECURITY_SEVERITY_RUBRIC.md'));
const securityPolicy = plainProse(readGovernanceDoc('SECURITY_POLICY.md'));

const LEVELS = ['critical', 'high', 'moderate', 'low'] as const;

/** Every "## Heading" in the document, in order. */
const sections = [...policy.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

/** Extract the body of a "## Heading" (text up to the next "## " heading). */
function headingBody(heading: string): string {
  const start = policy.indexOf(`${heading}\n`);
  expect(start, `heading "${heading}" is missing`).toBeGreaterThanOrEqual(0);
  const next = policy.indexOf('\n## ', start + 1);
  return plainProse(next === -1 ? policy.slice(start) : policy.slice(start, next));
}

/** Rows of the first level table in a section, keyed by the level name. */
function levelRows(heading: string): Map<string, string> {
  const body = policy.slice(policy.indexOf(`${heading}\n`));
  const rows = new Map<string, string>();
  for (const match of body.matchAll(/^\| `([a-z]+)` \| (.+) \|$/gm)) {
    if (!rows.has(match[1])) rows.set(match[1], match[2].toLowerCase());
  }
  return rows;
}

describe('PATCH_MANAGEMENT document structure', () => {
  it('is titled "Patch Management Policy"', () => {
    expect(policy.startsWith('# Patch Management Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Patch Cadence',
      'Prioritization',
      'Emergency Patch Path',
      'Exceptions',
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

describe('patch cadence guarantees', () => {
  it.each([
    'dependency audit review | at least once a week',
    'routine patch and minor updates | next scheduled release',
    'runtime and framework security releases | reviewed within 2 business days',
    'review of this policy | every 6 months',
  ])('sets the cadence "%s"', (row) => {
    expect(headingBody('## Patch Cadence')).toContain(row);
  });

  it('never makes a security fix wait for the routine cadence', () => {
    expect(headingBody('## Patch Cadence')).toContain('never waits for the routine cadence');
  });

  it('treats an observable major upgrade as a breaking change', () => {
    expect(headingBody('## Patch Cadence')).toContain('governance/policies/breaking_changes.md');
  });
});

describe('prioritization guarantees', () => {
  const levels = levelRows('## Prioritization');

  it('defines exactly the four levels, in descending order', () => {
    expect([...levels.keys()]).toEqual([...LEVELS]);
  });

  it.each([
    ['critical', '72 hours'],
    ['high', '7 calendar days'],
    ['moderate', '30 calendar days'],
    ['low', '90 calendar days'],
  ])('gives %s a deadline of %s that matches the rubric and security policy', (level, deadline) => {
    expect(levels.get(level)).toContain(deadline);
    expect(rubric).toMatch(new RegExp(`${level} \\| [^|]*${deadline}`));
    expect(securityPolicy).toMatch(new RegExp(`${level} report \\| [^|]*${deadline}`));
  });

  it('treats an unclassified finding as high, never lower', () => {
    const body = headingBody('## Prioritization');
    expect(body).toContain('treated as high');
    expect(body).toContain('never lowers urgency');
  });

  it('patches production-reachable dependencies first within a level', () => {
    expect(headingBody('## Prioritization')).toContain('reachable in production');
  });
});

describe('emergency patch path guarantees', () => {
  it.each([
    ['routes through the hotfix process', 'governance/processes/hotfix.md'],
    ['applies to critical findings', 'critical'],
    ['applies to high findings', 'high'],
    ['applies to active exploitation', 'actively exploited'],
    ['names one patch owner', 'names one patch owner'],
    ['ships the smallest fix', 'smallest change'],
    ['requires a non-author maintainer', 'maintainer other than the author'],
    ['requires a second maintainer for high or above', 'second maintainer'],
    ['rejects verbal approvals', 'verbal or chat approval does not count'],
    ['never skips review', 'never skips review'],
    ['runs the most relevant checks', 'checks most relevant'],
    ['backports the fix', 'governance/policies/backport.md'],
    ['keeps details private until fixed', 'governance/processes/coordinated_disclosure.md'],
    ['follows up within 5 business days', '5 business days'],
    ['reconstructs the fix as a tested change', 'reconstructed as a tested change'],
  ])('%s', (_name, phrase) => {
    expect(headingBody('## Emergency Patch Path')).toContain(phrase);
  });
});

describe('exceptions guarantees', () => {
  it.each([
    'no more than 30 days away',
    'a maintainer approves the exception',
    'told before the deadline passes',
  ])('requires "%s"', (phrase) => {
    expect(headingBody('## Exceptions')).toContain(phrase);
  });
});

describe('policy consistency with the governance folder', () => {
  it('limits changes to this policy to the Governance folder', () => {
    expect(headingBody('## Ownership and Review')).toContain('only the governance/ folder');
  });

  it('defers to the security policy when the two differ', () => {
    expect(headingBody('## Scope')).toContain('security policy wins');
  });

  it.each([
    'SECURITY_POLICY.md',
    'SECURITY_SEVERITY_RUBRIC.md',
    'roles/MAINTAINER.md',
    'processes/HOTFIX.md',
    'processes/RELEASE_CADENCE.md',
    'processes/COORDINATED_DISCLOSURE.md',
    'policies/BREAKING_CHANGES.md',
    'policies/BACKPORT.md',
    'policies/VERSIONING.md',
  ])('links to %s, which exists', (relativePath) => {
    expect(prose).toContain(`governance/${relativePath.toLowerCase()}`);
    expect(() => readGovernanceDoc(relativePath)).not.toThrow();
  });
});
