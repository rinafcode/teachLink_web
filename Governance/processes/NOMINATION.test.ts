/**
 * Regression tests for the Role Nomination Process
 * (Governance/processes/NOMINATION.md).
 *
 * The process is documentation, but it makes concrete, enforceable
 * guarantees: every nomination is raised as a public issue that states the
 * role, the candidate, the evidence, and a conflict declaration; no
 * nomination is decided without at least one second from someone other than
 * the nominator and the candidate; and every decision arrives within a
 * published timeline. These tests pin those guarantees to the checked-in
 * document so they cannot silently regress (for example, an edit that drops
 * the seconding requirement, relaxes a deadline, or removes the
 * public-issue rule fails CI), and they keep the document consistent with
 * `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PROCESS_PATH = path.resolve(__dirname, 'NOMINATION.md');
const processDoc = readFileSync(PROCESS_PATH, 'utf8');

/** Strip Markdown syntax so keyword assertions match prose, not formatting. */
function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1') // inline code keeps its text
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold keeps its text
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2') // links keep text and target
    .replace(/\s+/g, ' ') // line wrapping must not affect prose matching
    .toLowerCase();
}

const prose = plainProse(processDoc);

/** Every "## Heading" in the document, in order. */
const sections = [...processDoc.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

/** Extract the body of a single "## Section" (text up to the next heading). */
function sectionBody(title: string): string {
  const start = processDoc.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = processDoc.indexOf('\n## ', start + 1);
  const body = next === -1 ? processDoc.slice(start) : processDoc.slice(start, next);
  return plainProse(body);
}

describe('NOMINATION process document structure', () => {
  it('is titled "Role Nomination Process" like every governance document', () => {
    expect(processDoc.startsWith('# Role Nomination Process\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Raising a Nomination',
      'Seconding Requirement',
      'Decision Timeline',
      'Ownership',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Raising a Nomination');
    expect(sections).toContain('Seconding Requirement');
    expect(sections).toContain('Decision Timeline');
  });

  it('has no unresolved template placeholders', () => {
    expect(processDoc).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...processDoc.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('nomination raising guarantees', () => {
  const body = sectionBody('Raising a Nomination');

  it('requires a public issue and gives chat-only nominations no standing', () => {
    expect(body).toContain('opening a public issue');
    expect(body).toContain('does not start the timeline');
    expect(body).toContain('no standing');
  });

  it('requires the role, candidate, evidence, and conflict declaration', () => {
    const required = ['the role.', 'the candidate.', 'the evidence.', 'the conflict declaration.'];
    for (const field of required) {
      expect(body, `must state ${field}`).toContain(field);
    }
  });

  it('allows self-nominations on the same terms as any other nomination', () => {
    expect(body).toContain('self-nominations are allowed');
    expect(body).toContain('treated exactly like any other nomination');
  });

  it('routes conflict disclosure to the conflict of interest policy', () => {
    expect(body).toContain('governance/policies/conflict_of_interest.md');
  });

  it('acknowledges the nomination within 3 business days, like triage', () => {
    expect(body).toContain('acknowledges the nomination within 3 business days');
    expect(body).toContain('area label');
    expect(body).toContain('governance/processes/triage.md');
  });
});

describe('seconding requirement guarantees', () => {
  const body = sectionBody('Seconding Requirement');

  it('requires at least one second before the nomination is decided', () => {
    expect(body).toContain('at least one second');
    expect(body).toContain('reaches the maintainers for decision');
  });

  it('excludes the nominator and the candidate from supplying the second', () => {
    expect(body).toContain('someone other than the nominator and other than the candidate');
    expect(body).toContain('cannot second their own nomination');
    expect(body).toContain('never counted as the second');
  });

  it('asks the seconder for one sentence of their own reason', () => {
    expect(body).toContain('one sentence of the seconder');
    expect(body).toContain('statement of support');
  });

  it('closes the seconding window after 10 business days', () => {
    expect(body).toContain('posted within 10 business days');
    expect(body).toContain('of the nomination being opened');
  });

  it('lapses a nomination with no second and allows it to be re-raised', () => {
    expect(body).toContain('closed as not seconded');
    expect(body).toContain('re-raised after 30 calendar days');
  });

  it('treats the number of seconds as a floor, not a score', () => {
    expect(body).toContain('floor, not a score');
    expect(body).toContain('not the number of supporters');
  });
});

describe('decision timeline guarantees', () => {
  const body = sectionBody('Decision Timeline');

  it('starts the clock when the nomination issue is opened', () => {
    expect(body).toContain('the clock starts when the nomination issue is opened');
    expect(body).toContain('a commitment, not an estimate');
  });

  it('commits to acknowledgement, seconding, and decision deadlines', () => {
    const required = [
      '3 business days after opening',
      '10 business days after opening',
      '5 business days after the window closes',
      'maintainers',
    ];
    for (const deadline of required) {
      expect(body, `must commit to ${deadline}`).toContain(deadline);
    }
  });

  it('requires notice before a deadline is missed', () => {
    expect(body).toContain('before it passes');
    expect(body).toContain('the reason and a new date');
  });

  it('caps silence at 30 calendar days without a decision or a notice', () => {
    expect(body).toContain('more than 30 calendar days');
    expect(body).toContain('a notice giving a new date');
  });

  it('records exactly one of three outcomes with its reasoning', () => {
    expect(body).toContain('recorded on the issue with its reasoning');
    expect(body).toContain('appointed');
    expect(body).toContain('declined');
    expect(body).toContain('lapsed');
  });

  it('keeps the appointment history reconstructable from decided issues', () => {
    expect(body).toContain('set of decided nomination issues');
    expect(body).toContain('without private access');
  });
});

describe('process consistency with the governance folder', () => {
  it('defers to the documents it builds on, which must exist', () => {
    const referenced = [
      'TRIAGE.md', // same folder
      '../roles/CONTRIBUTOR.md',
      '../roles/MAINTAINER.md',
      '../roles/TREASURER.md',
      '../policies/CONFLICT_OF_INTEREST.md',
      '../RECOGNITION.md',
    ];
    for (const file of referenced) {
      const name = path.basename(file).toLowerCase();
      expect(prose, `must reference ${name}`).toContain(name);
      expect(() => readFileSync(path.resolve(__dirname, file), 'utf8')).not.toThrow();
    }
  });

  it('matches the response windows already committed elsewhere in Governance/', () => {
    // TRIAGE.md commits to a first maintainer response in three business days.
    const triage = plainProse(readFileSync(path.resolve(__dirname, 'TRIAGE.md'), 'utf8'));
    expect(triage).toContain('three business days');
    // CONFLICT_RESOLUTION.md records a maintainer decision within 5
    // business days, the same window this timeline gives the decision.
    const conflict = plainProse(
      readFileSync(path.resolve(__dirname, 'CONFLICT_RESOLUTION.md'), 'utf8'),
    );
    expect(conflict).toContain('5 business days');
    // The role documents point at this process for nominations and
    // promotions; they must keep doing so.
    const maintainer = plainProse(
      readFileSync(path.resolve(__dirname, '../roles/MAINTAINER.md'), 'utf8'),
    );
    expect(maintainer).toContain('role promotion process');
    const contributor = plainProse(
      readFileSync(path.resolve(__dirname, '../roles/CONTRIBUTOR.md'), 'utf8'),
    );
    expect(contributor).toContain('promotion process');
    const treasurer = plainProse(
      readFileSync(path.resolve(__dirname, '../roles/TREASURER.md'), 'utf8'),
    );
    expect(treasurer).toContain('role nomination and appointment');
  });

  it('mentions the governance-folder-only rule for changes to this process', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('only the governance/ folder');
  });

  it('pins regression coverage to the companion test file', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/processes/nomination.test.ts');
  });
});
