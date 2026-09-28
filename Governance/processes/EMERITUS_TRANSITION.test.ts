/**
 * Regression tests for the Emeritus Transition process
 * (Governance/processes/EMERITUS_TRANSITION.md).
 *
 * The process is documentation, but it makes concrete guarantees: three
 * triggers that all run one recorded sequence, an explicit list of retained
 * and withdrawn privileges, and a return path whose thresholds match
 * `Governance/policies/INACTIVITY.md`. These tests pin those guarantees to
 * the checked-in document so an edit cannot silently drop a trigger, keep a
 * withdrawn privilege, or put a barrier in front of a returning member, and
 * they keep the document consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PROCESS_PATH = path.resolve(__dirname, 'EMERITUS_TRANSITION.md');
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

describe('EMERITUS_TRANSITION process document structure', () => {
  it('is titled "Emeritus Transition Process"', () => {
    expect(processDoc.startsWith('# Emeritus Transition Process\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'When a Member Moves to Emeritus',
      'Privileges Retained',
      'Privileges Withdrawn',
      'Returning to Active Status',
      'Ownership',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('When a Member Moves to Emeritus');
    expect(sections).toContain('Privileges Retained');
    expect(sections).toContain('Returning to Active Status');
  });

  it('has no unresolved template placeholders', () => {
    expect(processDoc).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...processDoc.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('transition trigger guarantees', () => {
  const body = sectionBody('When a Member Moves to Emeritus');

  it('names the three triggers that start the same transition', () => {
    const required = ['voluntary step-down', 'end of a fixed term', 'role consolidation'];
    for (const trigger of required) {
      expect(body).toContain(trigger);
    }
  });

  it('starts the transition from a request or a consented proposal only', () => {
    expect(body).toContain('the member requests the transition');
    expect(body).toContain('a proposal without consent does not proceed');
  });

  it('records the sequence with an owner and a deadline at each step', () => {
    expect(body).toContain('acknowledgement within 3 business days');
    expect(body).toContain('recorded decision within 10 business days');
    expect(body).toContain('applied within 5 business days of the decision');
    expect(body).toContain('public transition issue');
  });

  it('requires notice before a deadline is missed', () => {
    expect(body).toContain('told on the transition issue before it passes');
    expect(body).toContain('the reason and a new date');
  });
});

describe('scope guarantees', () => {
  const body = sectionBody('Scope');

  it('makes emeritus opt-in and never a disciplinary outcome', () => {
    expect(body).toContain('emeritus is opt-in');
    expect(body).toContain('without their agreement');
    expect(body).toContain('never removes a role as a disciplinary measure');
  });

  it('keeps the transition out of the inactivity and misconduct paths', () => {
    expect(body).toContain('governance/policies/inactivity.md');
    expect(body).toContain('governance/code_of_conduct.md');
    expect(body).toContain('not placed in emeritus status by this process');
  });
});

describe('retained privilege guarantees', () => {
  const body = sectionBody('Privileges Retained');

  it('keeps recognition, attribution, and read access', () => {
    expect(body).toContain('governance/recognition.md');
    expect(body).toContain('attribution for past work');
    expect(body).toContain('repository read access');
  });

  it('keeps community participation without recreating authority', () => {
    expect(body).toContain('governance/roles/contributor.md');
    expect(body).toContain('a voice to advise');
    expect(body).toContain('no vote and no effect on quorum');
  });

  it('keeps informal consultation only with consent', () => {
    expect(body).toContain('when the member consents');
    expect(body).toContain('advice rather than as a required approval');
  });
});

describe('withdrawn privilege guarantees', () => {
  const body = sectionBody('Privileges Withdrawn');

  it('withdraws decision authority and quorum', () => {
    expect(body).toContain('voting rights and quorum');
    expect(body).toContain('decision authority attached to the role');
  });

  it('withdraws elevated access and CODEOWNERS placement', () => {
    expect(body).toContain('write and admin');
    expect(body).toContain('reduced to community-level read access');
    expect(body).toContain('codeowners');
    expect(body).toContain('review-assignment rotation');
  });

  it('withdraws private and representative privileges', () => {
    expect(body).toContain('private channels');
    expect(body).toContain('represent the project externally');
  });

  it('lists the withdrawn privileges and applies them after the decision', () => {
    expect(body).toContain('listed explicitly on the transition issue');
    expect(body).toContain('only after the recorded decision');
  });
});

describe('return-to-active guarantees', () => {
  const body = sectionBody('Returning to Active Status');

  it('makes emeritus reversible and never a bar to returning', () => {
    expect(body).toContain('reversible and is never a bar to returning');
    expect(body).toContain('ask to return at any time');
  });

  it('matches the reinstatement path in the inactivity policy', () => {
    const inactivity = plainProse(
      readFileSync(path.resolve(__dirname, '../policies/INACTIVITY.md'), 'utf8'),
    );
    // Contributor returns with a merged pull request, no approval required.
    expect(body).toContain('merged pull request reactivates the member');
    expect(inactivity).toContain('reinstatement is automatic on the next merged pull request');
    // Reviewer returns after two completed reviews with one maintainer.
    expect(body).toContain('at least two completed reviews');
    expect(inactivity).toContain('two completed reviews');
    // Maintainer returns after four reviews or pulls in 60 days, two approvals.
    expect(body).toContain('at least four completed reviews');
    expect(body).toContain('within 60 days');
    expect(inactivity).toContain('four completed reviews or');
    expect(inactivity).toContain('60-day window');
  });

  it('offers appointment by nomination as an alternative to reinstatement', () => {
    expect(body).toContain('governance/processes/nomination.md');
    expect(body).toContain('prior emeritus service is evidence');
    expect(body).toContain('does not shorten the seconding requirement');
  });

  it('puts no waiting period or penalty on a returning member', () => {
    expect(body).toContain('no waiting period and no penalty');
    expect(body).toContain('restores the full privileges of the role');
  });

  it('gives the return request a deadline', () => {
    expect(body).toContain('acknowledged within 3 business days');
    expect(body).toContain('decided within 10 business days');
  });
});

describe('process consistency with the governance folder', () => {
  it('defers to companion documents that must exist', () => {
    const referenced = [
      '../roles/EMERITUS.md',
      '../roles/CONTRIBUTOR.md',
      '../roles/MAINTAINER.md',
      '../policies/INACTIVITY.md',
      '../RECOGNITION.md',
      '../CODE_OF_CONDUCT.md',
      'NOMINATION.md',
    ];
    for (const file of referenced) {
      const name = path.basename(file).toLowerCase();
      expect(plainProse(processDoc), `must reference ${name}`).toContain(name);
      expect(() => readFileSync(path.resolve(__dirname, file), 'utf8')).not.toThrow();
    }
  });

  it('matches the retaining and removing rule stated by the emeritus role', () => {
    const role = plainProse(readFileSync(path.resolve(__dirname, '../roles/EMERITUS.md'), 'utf8'));
    // Both documents agree that authority is not retained without reappointment.
    expect(role).toContain('unless explicitly reappointed');
    expect(plainProse(processDoc)).toContain('unless the member is reappointed');
    // Both documents agree emeritus is opt-in.
    expect(role).toContain('honorary and opt-in');
    expect(plainProse(processDoc)).toContain('emeritus is opt-in');
  });

  it('mentions the governance-folder-only rule for changes to this process', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('only the governance/ folder');
  });

  it('pins regression coverage to the companion test file', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/processes/emeritus_transition.test.ts');
  });
});
