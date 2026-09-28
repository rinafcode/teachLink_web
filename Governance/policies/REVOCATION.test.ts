/**
 * Regression tests for the Privilege Revocation Policy
 * (Governance/policies/REVOCATION.md).
 *
 * The policy is documentation, but it makes concrete, enforceable
 * guarantees: a closed list of grounds, named parties who may initiate a
 * revocation, a fixed sequence of steps, and an appeal path with real
 * windows. These tests pin those guarantees to the checked-in document so
 * they cannot silently regress (for example, an edit that adds an
 * unenumerated ground or drops the appeal path fails CI), and they keep the
 * document consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'REVOCATION.md');
const policy = readFileSync(POLICY_PATH, 'utf8');

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

describe('REVOCATION policy document structure', () => {
  it('is titled "Privilege Revocation Policy"', () => {
    expect(policy.startsWith('# Privilege Revocation Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Grounds for Revocation',
      'Who May Initiate',
      'Revocation Steps',
      'Appeal Path',
      'Ownership and Review',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Grounds for Revocation');
    expect(sections).toContain('Who May Initiate');
    expect(sections).toContain('Appeal Path');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('grounds for revocation guarantees', () => {
  const body = sectionBody('Grounds for Revocation');

  it('is a closed list rather than an open-ended sanction', () => {
    expect(body).toContain('only on an enumerated ground');
    expect(body).toContain('never used as a general sanction');
  });

  it('includes the five enumerated grounds', () => {
    const required = [
      'security risk',
      'confirmed misconduct',
      'breach of trust',
      'loss of competence or availability',
      'legal or platform requirement',
    ];
    for (const ground of required) {
      expect(body).toContain(ground);
    }
  });

  it('requires the record to name the ground relied on', () => {
    expect(body).toContain('states which ground applies');
  });
});

describe('who may initiate guarantees', () => {
  const body = sectionBody('Who May Initiate');

  it('names maintainers, the security team, role owners, and the holder', () => {
    expect(body).toContain('maintainers');
    expect(body).toContain('security response team');
    expect(body).toContain('working group or role owner');
    expect(body).toContain('voluntarily surrender');
  });

  it('lets the security team act first on an active risk and document after', () => {
    expect(body).toContain('act first');
    expect(body).toContain('active risk');
  });

  it('forbids an initiator deciding a revocation they are subject to', () => {
    expect(body).toContain('may not decide');
  });

  it('requires a conflict-of-interest disclosure', () => {
    expect(body).toContain('conflict_of_interest.md');
  });
});

describe('revocation step guarantees', () => {
  const body = sectionBody('Revocation Steps');

  it('opens a record with holder, privilege, ground, and evidence', () => {
    expect(body).toContain('holder');
    expect(body).toContain('privilege');
    expect(body).toContain('ground');
    expect(body).toContain('evidence');
  });

  it('requires an independent decision-maker', () => {
    expect(body).toContain('independent');
  });

  it('rotates every credential and revokes issued keys on removal', () => {
    expect(body).toContain('rotated or revoked');
  });

  it('notifies the holder and records the decision', () => {
    expect(body).toContain('notified');
    expect(body).toContain('recorded');
  });
});

describe('appeal path guarantees', () => {
  const body = sectionBody('Appeal Path');

  it('offers an appeal to every affected holder', () => {
    expect(body).toContain('may appeal');
  });

  it('sets a 14 calendar day filing window', () => {
    expect(body).toContain('14 calendar days');
  });

  it('requires an independent review decided within 10 business days', () => {
    expect(body).toContain('independent reviewer');
    expect(body).toContain('10 business days');
  });

  it('requires a written decision with reasoning', () => {
    expect(body).toContain('written decision with reasoning');
  });

  it('allows one re-review with new evidence', () => {
    expect(body).toContain('re-review once');
  });

  it('keeps a security revocation in force during appeal only with a record', () => {
    expect(body).toContain('security or legal');
    expect(body).toContain('retrospective independent review');
  });

  it('rejects a review that merely restates the original decision', () => {
    expect(body).toContain('not an independent review');
  });
});

describe('policy consistency with the governance folder', () => {
  it('routes escalation to the escalation-path process document', () => {
    expect(prose).toContain('governance/processes/escalation_path.md');
    expect(() =>
      readFileSync(path.resolve(__dirname, '../processes/ESCALATION_PATH.md'), 'utf8'),
    ).not.toThrow();
  });

  it('references the maintainer role document that exists', () => {
    expect(prose).toContain('governance/roles/maintainer.md');
    expect(() =>
      readFileSync(path.resolve(__dirname, '../roles/MAINTAINER.md'), 'utf8'),
    ).not.toThrow();
  });

  it('references the security response team charter that exists', () => {
    expect(prose).toContain('governance/security_response_team.md');
    expect(() =>
      readFileSync(path.resolve(__dirname, '../SECURITY_RESPONSE_TEAM.md'), 'utf8'),
    ).not.toThrow();
  });

  it('mentions the governance-folder-only rule for changes to this policy', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('keeps the change self-contained in the governance folder', () => {
    const body = sectionBody('Scope');
    expect(body).toContain('repository access levels');
    expect(body).toContain('credentials');
  });
});
