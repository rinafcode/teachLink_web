/**
 * Regression tests for the Code of Conduct Reporting Process
 * (Governance/COC_REPORTING.md).
 *
 * The document is governance, but it makes concrete, enforceable
 * guarantees: a private reporting channel, a response timeline, and
 * a confidentiality guarantee for the reporter. These tests pin
 * those guarantees to the checked-in document so they cannot
 * silently regress (for example, an edit that lengthens the
 * acknowledgement window or drops reporter confidentiality fails
 * CI), and they keep the document consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'COC_REPORTING.md');
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

describe('COC_REPORTING document structure', () => {
  it('is titled "Code of Conduct Reporting Process"', () => {
    expect(policy.startsWith('# Code of Conduct Reporting Process\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Reporting Channel',
      'Response Timeline',
      'Confidentiality',
      'Ownership and Review',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Reporting Channel');
    expect(sections).toContain('Response Timeline');
    expect(sections).toContain('Confidentiality');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('reporting channel guarantees', () => {
  const body = sectionBody('Reporting Channel');

  it('requires reports to be made privately, never in public issues', () => {
    expect(body).toContain('made privately');
    expect(body).toContain('must not be filed as a public issue');
  });

  it('names the conduct contact as the preferred channel', () => {
    expect(body).toContain('conduct contact');
    expect(body).toContain('conduct report for teachlink_web');
  });

  it('offers an alternative when the conduct contact is involved', () => {
    expect(body).toContain('any other maintainer');
  });

  it('keeps the public fallback free of incident details', () => {
    expect(body).toContain('conduct contact request');
    expect(body).toContain('no details of the incident');
  });

  it('accepts anonymous and partial reports', () => {
    expect(body).toContain('anonymously');
    expect(body).toContain('partial report is always accepted');
  });
});

describe('response timeline guarantees', () => {
  const body = sectionBody('Response Timeline');

  it('acknowledges reports within 2 business days', () => {
    expect(body).toContain('acknowledgement of the report | 2 business days');
  });

  it('shares an initial assessment within 5 business days', () => {
    expect(body).toContain('initial assessment');
    expect(body).toContain('5 business days');
  });

  it('sends progress updates every 7 calendar days', () => {
    expect(body).toContain('every 7 calendar days');
  });

  it('resolves or explains within 30 calendar days', () => {
    expect(body).toContain('30 calendar days');
  });

  it('takes interim action on urgent safety concerns within 24 hours', () => {
    expect(body).toContain('urgent safety concern');
    expect(body).toContain('within 24 hours');
  });

  it('tells the reporter before a deadline is missed', () => {
    expect(body).toContain('told before it passes');
  });
});

describe('confidentiality guarantees', () => {
  const body = sectionBody('Confidentiality');

  it("keeps the reporter's identity confidential", () => {
    expect(body).toContain("reporter's identity is kept confidential");
    expect(body).toContain("never with the reported person without the reporter's consent");
  });

  it('shares report details on a need-to-know basis', () => {
    expect(body).toContain('need-to-know');
  });

  it('requires involved maintainers to step aside', () => {
    expect(body).toContain('conflicts of interest');
    expect(body).toContain('steps aside');
  });

  it('keeps records private', () => {
    expect(body).toContain('private conduct record');
  });

  it('prohibits retaliation against good-faith reporters', () => {
    expect(body).toContain('retaliation is prohibited');
  });

  it('limits confidentiality only for legal duty or imminent harm', () => {
    expect(body).toContain('required by law');
    expect(body).toContain('imminent harm');
  });
});

describe('policy consistency with the governance folder', () => {
  it('mentions the governance-folder-only rule for changes to this process', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it.each([
    'CODE_OF_CONDUCT.md',
    'COC_ENFORCEMENT.md',
    'SECURITY_POLICY.md',
    'processes/TRIAGE.md',
    'policies/CONFLICT_OF_INTEREST.md',
    'roles/MAINTAINER.md',
  ])('links to %s, which exists', (relativePath) => {
    expect(prose).toContain(`governance/${relativePath.toLowerCase()}`);
    expect(() => readGovernanceDoc(relativePath)).not.toThrow();
  });
});
