/**
 * Regression tests for the Contributor Offboarding Process
 * (Governance/processes/OFFBOARDING.md).
 *
 * The process is documentation, but it makes concrete, enforceable
 * guarantees: three offboarding triggers each backed by a public issue,
 * access revocation proportional to role, a knowledge handover window,
 * and secret-rotation deadlines that protect the project after a
 * maintainer departs. These tests pin those guarantees to the
 * checked-in document so they cannot silently regress — for example,
 * an edit that removes the secret-rotation deadline, drops the
 * tracking-issue requirement, or relaxes the handover window fails CI.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PROCESS_PATH = path.resolve(__dirname, 'OFFBOARDING.md');
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
const sections = [...processDoc.matchAll(/^## (.+)$/gm)].map((m) => m[1]);

/** Extract the body of a single "## Section" (text up to next heading). */
function sectionBody(title: string): string {
  const start = processDoc.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = processDoc.indexOf('\n## ', start + 1);
  const body =
    next === -1 ? processDoc.slice(start) : processDoc.slice(start, next);
  return plainProse(body);
}

// ---------------------------------------------------------------------------
// Document structure
// ---------------------------------------------------------------------------

describe('OFFBOARDING process document structure', () => {
  it('is titled "Contributor Offboarding Process"', () => {
    expect(processDoc.startsWith('# Contributor Offboarding Process\n')).toBe(
      true,
    );
  });

  it('keeps the canonical governance document sections in order', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Offboarding Triggers and Initiation',
      'Access Revocation',
      'Knowledge Handover',
      'Timeline Summary',
      'Ownership',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Offboarding Triggers and Initiation');
    expect(sections).toContain('Access Revocation');
    expect(sections).toContain('Knowledge Handover');
  });

  it('has no unresolved template placeholders', () => {
    expect(processDoc).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(
      ...processDoc.split('\n').map((line) => line.length),
    );
    expect(longest).toBeLessThanOrEqual(82);
  });
});

// ---------------------------------------------------------------------------
// Trigger and initiation guarantees
// ---------------------------------------------------------------------------

describe('offboarding trigger guarantees', () => {
  const body = sectionBody('Offboarding Triggers and Initiation');

  it('requires a public tracking issue for every departure', () => {
    expect(body).toContain('offboarding: [role] — @[handle]');
    expect(body).toContain('public github issue');
  });

  it('names all three offboarding triggers', () => {
    expect(body).toContain('voluntary departure');
    expect(body).toContain('inactivity-triggered');
    expect(body).toContain('role removal');
  });

  it('requires a maintainer to acknowledge within 3 business days', () => {
    expect(body).toContain('3 business days');
    expect(body).toContain('acknowledges the offboarding');
  });

  it('links the trigger event on the tracking issue', () => {
    expect(body).toContain('links the trigger');
  });
});

// ---------------------------------------------------------------------------
// Access revocation guarantees
// ---------------------------------------------------------------------------

describe('access revocation guarantees', () => {
  const body = sectionBody('Access Revocation');

  it('completes revocation within 5 business days of the issue opening', () => {
    expect(body).toContain('5 business days');
    expect(body).toContain('offboarding issue being opened');
  });

  it('applies revocation proportional to the role', () => {
    expect(body).toContain('contributor');
    expect(body).toContain('reviewer');
    expect(body).toContain('maintainer');
    expect(body).toContain('working-group lead');
  });

  it('retains repository read access for contributors and reviewers', () => {
    expect(body).toContain('repository read access is retained');
  });

  it('rotates individually held maintainer secrets within 24 hours', () => {
    expect(body).toContain('24 hours');
    expect(body).toContain('individually held');
    expect(body).toContain('rotated');
  });

  it('rotates shared credentials within 5 business days', () => {
    expect(body).toContain('shared credentials');
    expect(body).toContain('5 business days');
  });

  it('ticks off every revocation step on the tracking issue', () => {
    expect(body).toContain('ticked off on the offboarding tracking issue');
    expect(body).toContain('not closed until all steps are recorded');
  });

  it('places a working group in caretaker state if no co-lead exists', () => {
    expect(body).toContain('caretaker state');
    expect(body).toContain('maintainer team');
  });
});

// ---------------------------------------------------------------------------
// Knowledge handover guarantees
// ---------------------------------------------------------------------------

describe('knowledge handover guarantees', () => {
  const body = sectionBody('Knowledge Handover');

  it('requires handover for maintainers and working-group leads', () => {
    expect(body).toContain('required for maintainers');
    expect(body).toContain('working-group leads');
  });

  it('asks for open work, institutional knowledge, and credential status', () => {
    expect(body).toContain('open work');
    expect(body).toContain('institutional knowledge');
    expect(body).toContain('keys and credentials');
  });

  it('closes the handover window after 10 business days', () => {
    expect(body).toContain('10 business days');
    expect(body).toContain('handover window');
  });

  it('does not hold offboarding open indefinitely for a non-response', () => {
    expect(body).toContain('does not hold offboarding open indefinitely');
    expect(body).toContain('proceeds');
  });
});

// ---------------------------------------------------------------------------
// Timeline summary guarantees
// ---------------------------------------------------------------------------

describe('timeline summary guarantees', () => {
  const body = sectionBody('Timeline Summary');

  it('commits deadlines in the timeline summary', () => {
    const required = [
      '3 business days',
      '5 business days',
      '24 hours',
      '10 business days',
    ];
    for (const deadline of required) {
      expect(body, `must list ${deadline}`).toContain(deadline);
    }
  });

  it('requires a revised date on the issue if a deadline is missed', () => {
    expect(body).toContain('revised date');
    expect(body).toContain('before the deadline passes');
  });
});

// ---------------------------------------------------------------------------
// Consistency with the broader Governance folder
// ---------------------------------------------------------------------------

describe('process consistency with the governance folder', () => {
  it('defers to the governance documents it builds on, which must exist', () => {
    const referenced = [
      'CONFLICT_RESOLUTION.md', // same folder
      '../policies/INACTIVITY.md',
      '../roles/MAINTAINER.md',
    ];
    for (const file of referenced) {
      const name = path.basename(file).toLowerCase();
      expect(prose, `must reference ${name}`).toContain(name);
      expect(
        () => readFileSync(path.resolve(__dirname, file), 'utf8'),
      ).not.toThrow();
    }
  });

  it('mentions the governance-folder-only rule for changes to this process', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('only the governance/ folder');
  });

  it('pins regression coverage to the companion test file', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/processes/offboarding.test.ts');
  });
});
