/**
 * Regression tests for the Escalation Path process
 * (Governance/processes/ESCALATION_PATH.md).
 *
 * The process is documentation, but it makes concrete, enforceable
 * guarantees: three escalation tiers with a named contact each, a
 * fast track for security, privacy, and safety, and a response SLA
 * per tier that matches the narrower governance documents. These
 * tests pin those guarantees to the checked-in document so they
 * cannot silently regress (for example, an edit that drops a tier,
 * removes the fast track, or relaxes an SLA fails CI), and they keep
 * the document consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PROCESS_PATH = path.resolve(__dirname, 'ESCALATION_PATH.md');
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

describe('ESCALATION_PATH process document structure', () => {
  it('is titled "Escalation Path" like every governance document', () => {
    expect(processDoc.startsWith('# Escalation Path\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Escalation Tiers',
      'Contacts at Each Tier',
      'Response SLAs',
      'Escalation Rules',
      'Ownership',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Escalation Tiers');
    expect(sections).toContain('Contacts at Each Tier');
    expect(sections).toContain('Response SLAs');
  });

  it('has no unresolved template placeholders', () => {
    expect(processDoc).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...processDoc.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('escalation tier guarantees', () => {
  const body = sectionBody('Escalation Tiers');

  it('defines three tiers plus a security fast track', () => {
    const required = [
      'tier 1. working level',
      'tier 2. maintainers',
      'tier 3. project leadership',
      'fast track. security, privacy, and safety',
    ];
    for (const tier of required) {
      expect(body).toContain(tier);
    }
  });

  it('moves one tier at a time with the record travelling with it', () => {
    expect(body).toContain('one tier at a time');
    expect(body).toContain('record travels with it');
    expect(body).toContain('does not restart the discussion');
  });

  it('starts every concern at tier 1 in the open', () => {
    expect(body).toContain('every concern starts here');
    expect(body).toContain('in the open');
  });

  it('makes tier 3 the terminal tier', () => {
    expect(body).toContain('terminal tier');
    expect(body).toContain('closes the escalation path');
  });

  it('never queues security, privacy, or safety in the tiers', () => {
    expect(body).toContain('never queue');
    expect(body).toContain('handled immediately');
    expect(body).toContain('security response team');
  });

  it('routes self-harm or violence reports to appropriate help', () => {
    expect(body).toContain('self-harm or violence');
    expect(body).toContain('redirected to appropriate help');
  });
});

describe('contact guarantees', () => {
  const body = sectionBody('Contacts at Each Tier');

  it('names one contact for every tier and the fast track', () => {
    const required = [
      'issue triager',
      'any maintainer',
      'project leadership',
      'security contact for the current quarter',
    ];
    for (const contact of required) {
      expect(body).toContain(contact);
    }
  });

  it('keeps escalations in the same thread or private channels', () => {
    expect(body).toContain('the same issue, pull request, or channel');
    expect(body).toContain('the same thread');
    expect(body).toContain('private vulnerability reporting channel');
  });

  it('maintains no public list of personal contact details', () => {
    expect(body).toContain('no separate public list of personal contact details');
    expect(body).toContain('authoritative roster');
  });

  it('routes private conduct matters to the conduct channel', () => {
    expect(body).toContain('private conduct channel');
    expect(body).toContain('on behalf of a party who cannot safely raise');
  });
});

describe('response SLA guarantees', () => {
  const body = sectionBody('Response SLAs');

  it('commits to a first human response window per tier', () => {
    expect(body).toContain('first human response');
    expect(body).toContain('3 business days');
    expect(body).toContain('5 business days');
    expect(body).toContain('1 business day (24 hours)');
  });

  it('commits tier 3 to a recorded decision within 10 business days', () => {
    expect(body).toContain('recorded decision within 10 business days');
  });

  it('starts the clock when the escalation is raised', () => {
    expect(body).toContain('the clock starts when the escalation is raised');
  });

  it('requires notice before a deadline is missed', () => {
    expect(body).toContain('told before it passes');
    expect(body).toContain('the reason and a new date');
  });

  it('counts missed deadlines without notice in the quarterly review', () => {
    expect(body).toContain('missed deadline without notice');
    expect(body).toContain('quarterly review');
  });
});

describe('escalation rule guarantees', () => {
  const body = sectionBody('Escalation Rules');

  it('allows a tier to be skipped only for the fast track, with a reason', () => {
    expect(body).toContain('skipped only for the fast track');
    expect(body).toContain('reason for any skip is recorded');
  });

  it('allows re-review once with new evidence', () => {
    expect(body).toContain('re-review once, with new evidence');
    expect(body).toContain('unless new facts emerge');
  });

  it('treats retaliation for escalating as a fresh conduct matter', () => {
    expect(body).toContain('about the matter, not the person');
    expect(body).toContain('fresh conduct matter');
  });

  it('lets a matter be handed back once unblocked, with a reason', () => {
    expect(body).toContain('handed back to a lower tier');
    expect(body).toContain('the hand-back and its reason are recorded');
  });
});

describe('process consistency with the governance folder', () => {
  it('defers to the narrower process documents, which must exist', () => {
    const referenced = [
      'CONFLICT_RESOLUTION.md', // same folder
      'TRIAGE.md', // same folder
      'VULN_DISCLOSURE.md', // same folder
      '../COC_APPEALS.md',
      '../SECURITY_POLICY.md',
      '../SECURITY_RESPONSE_TEAM.md',
      '../roles/MAINTAINER.md',
    ];
    for (const file of referenced) {
      const name = path.basename(file).toLowerCase();
      expect(prose, `must reference ${name}`).toContain(name);
      expect(() => readFileSync(path.resolve(__dirname, file), 'utf8')).not.toThrow();
    }
  });

  it('matches the SLAs already committed elsewhere in Governance/', () => {
    // SECURITY_POLICY.md acknowledges reports in 1 business day (24 hours).
    const securityPolicy = plainProse(
      readFileSync(path.resolve(__dirname, '../SECURITY_POLICY.md'), 'utf8'),
    );
    expect(securityPolicy).toContain('1 business day (24 hours)');
    // TRIAGE.md commits to a first maintainer response in 3 business days.
    const triage = plainProse(readFileSync(path.resolve(__dirname, 'TRIAGE.md'), 'utf8'));
    expect(triage).toContain('three business days');
    // CONFLICT_RESOLUTION.md records a maintainer decision within 5
    // business days of escalation.
    const conflict = plainProse(
      readFileSync(path.resolve(__dirname, 'CONFLICT_RESOLUTION.md'), 'utf8'),
    );
    expect(conflict).toContain('5 business days');
  });

  it('mentions the governance-folder-only rule for changes to this process', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('only the governance/ folder');
  });

  it('pins regression coverage to the companion test file', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/processes/escalation_path.test.ts');
  });
});
