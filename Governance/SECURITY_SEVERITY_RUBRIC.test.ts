/**
 * Regression tests for the Security Severity Rubric
 * (Governance/SECURITY_SEVERITY_RUBRIC.md).
 *
 * The document is governance, but it makes concrete, enforceable
 * guarantees: the severity levels, the criteria per level, and the
 * response SLA per level. These tests pin those guarantees to the
 * checked-in document so they cannot silently regress, and they
 * check that every SLA still matches `Governance/SECURITY_POLICY.md`
 * so the two documents cannot drift apart.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'SECURITY_SEVERITY_RUBRIC.md');
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
const securityPolicy = plainProse(readGovernanceDoc('SECURITY_POLICY.md'));

const LEVELS = ['critical', 'high', 'moderate', 'low'] as const;

/** Every "## Heading" in the document, in order. */
const sections = [...policy.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

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

/** Rows of the first Markdown table in a section, keyed by the first cell. */
function tableRows(heading: string): Map<string, string> {
  const body = policy.slice(policy.indexOf(`${heading}\n`));
  const rows = new Map<string, string>();
  for (const match of body.matchAll(/^\| `([a-z]+)` \| (.+) \|$/gm)) {
    if (!rows.has(match[1])) rows.set(match[1], match[2].toLowerCase());
  }
  return rows;
}

describe('SECURITY_SEVERITY_RUBRIC document structure', () => {
  it('is titled "Security Severity Rubric"', () => {
    expect(policy.startsWith('# Security Severity Rubric\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Severity Levels',
      'Criteria per Level',
      'Response SLA per Level',
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

describe('severity level guarantees', () => {
  it('defines exactly the four levels, in descending order', () => {
    expect([...tableRows('## Severity Levels').keys()]).toEqual([...LEVELS]);
  });

  it('uses the same levels as the security policy', () => {
    for (const level of LEVELS) {
      expect(securityPolicy).toContain(`${level}.`);
    }
  });
});

describe('criteria per level guarantees', () => {
  it.each(LEVELS)('defines criteria for %s', (level) => {
    const heading = `### ${level[0].toUpperCase()}${level.slice(1)}`;
    expect(headingBody(heading).split('- ').length).toBeGreaterThan(2);
  });

  it('classifies remote code execution and active exploitation as critical', () => {
    const body = headingBody('### Critical');
    expect(body).toContain('remote code execution');
    expect(body).toContain('actively exploited');
  });

  it('classifies privilege escalation as high', () => {
    expect(headingBody('### High')).toContain('privilege escalation');
  });

  it('assesses an unclassified report as high, never lower', () => {
    const body = headingBody('### Adjusting the level');
    expect(body).toContain('assessed as high');
    expect(body).toContain('never lowers urgency');
  });

  it('lowers a level only with a recorded reason', () => {
    expect(headingBody('### Adjusting the level')).toContain('recorded reason');
  });
});

describe('response SLA per level guarantees', () => {
  const sla = tableRows('## Response SLA per Level');

  it('defines an SLA for every level', () => {
    expect([...sla.keys()]).toEqual([...LEVELS]);
  });

  it.each([
    ['critical', '72 hours'],
    ['high', '7 calendar days'],
    ['moderate', '30 calendar days'],
    ['low', '90 calendar days'],
  ])('gives %s a deadline of %s that matches the security policy', (level, deadline) => {
    expect(sla.get(level)).toContain(deadline);
    expect(securityPolicy).toContain(`${level} report | `);
    expect(securityPolicy).toMatch(new RegExp(`${level} report \\| [^|]*${deadline}`));
  });

  it('keeps the acknowledgement and assessment windows of the security policy', () => {
    const body = headingBody('## Response SLA per Level');
    expect(body).toContain('1 business day (24 hours)');
    expect(body).toContain('3 business days (72 hours)');
    expect(securityPolicy).toContain('1 business day (24 hours)');
    expect(securityPolicy).toContain('3 business days (72 hours)');
  });

  it('routes critical and high fixes through the hotfix path', () => {
    const body = headingBody('## Response SLA per Level');
    expect(body).toContain('governance/processes/hotfix.md');
  });

  it('tells the reporter before an SLA is missed', () => {
    expect(headingBody('## Response SLA per Level')).toContain('told before it passes');
  });
});

describe('policy consistency with the governance folder', () => {
  it('mentions the governance-folder-only rule for changes to this rubric', () => {
    const body = headingBody('## Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('requires a second maintainer to review high and critical assessments', () => {
    expect(headingBody('## Ownership and Review')).toContain('second maintainer');
  });

  it.each([
    'SECURITY_POLICY.md',
    'processes/VULN_DISCLOSURE.md',
    'processes/HOTFIX.md',
    'roles/MAINTAINER.md',
  ])('links to %s, which exists', (relativePath) => {
    expect(prose).toContain(`governance/${relativePath.toLowerCase()}`);
    expect(() => readGovernanceDoc(relativePath)).not.toThrow();
  });
});
