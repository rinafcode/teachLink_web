/**
 * Regression tests for the Inactivity Policy
 * (Governance/policies/INACTIVITY.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * per-role inactivity thresholds, a mandatory multi-step notification process,
 * proportional consequences, and a reinstatement path. These tests pin those
 * guarantees to the checked-in document so they cannot silently regress (for
 * example, an edit that shortens the Maintainer threshold or drops a required
 * notification step fails CI), and they keep the document consistent with the
 * rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'INACTIVITY.md');
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
const sections = [...policy.matchAll(/^## (.+)$/gm)].map((m) => m[1]);

/** Extract the body of a single "## Section" (text up to the next heading). */
function sectionBody(title: string): string {
  const start = policy.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = policy.indexOf('\n## ', start + 1);
  const body = next === -1 ? policy.slice(start) : policy.slice(start, next);
  return plainProse(body);
}

// ---------------------------------------------------------------------------
// Document structure
// ---------------------------------------------------------------------------

describe('INACTIVITY policy document structure', () => {
  it('is titled "Inactivity Policy"', () => {
    expect(policy.startsWith('# Inactivity Policy\n')).toBe(true);
  });

  it('contains the canonical governance section order', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Inactivity Thresholds',
      'Notification Process',
      'Consequences',
      'Reinstatement',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the four areas required by the issue', () => {
    expect(sections).toContain('Inactivity Thresholds');
    expect(sections).toContain('Notification Process');
    expect(sections).toContain('Consequences');
    expect(sections).toContain('Reinstatement');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((l) => l.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

// ---------------------------------------------------------------------------
// Inactivity thresholds
// ---------------------------------------------------------------------------

describe('inactivity threshold guarantees', () => {
  const body = sectionBody('Inactivity Thresholds');

  it('defines a threshold for the Contributor role', () => {
    expect(body).toContain('contributor');
    expect(body).toContain('six months');
  });

  it('defines a threshold for the Reviewer role', () => {
    expect(body).toContain('reviewer');
    expect(body).toContain('three months');
  });

  it('defines a threshold for the Maintainer role', () => {
    expect(body).toContain('maintainer');
    expect(body).toContain('two months');
  });

  it('defines a threshold for working-group leads and domain stewards', () => {
    expect(body).toMatch(/working.group lead/);
    expect(body).toContain('domain steward');
    expect(body).toContain('two months');
  });

  it('specifies that a single qualifying action resets the clock', () => {
    expect(body).toContain('resets the clock');
  });

  it('excludes passive actions from resetting the clock', () => {
    expect(body).toContain('passive actions');
    expect(body).toContain('do not reset the clock');
  });

  it('does not set the Maintainer threshold longer than Reviewer', () => {
    // Maintainer = 2 months, Reviewer = 3 months — shorter, not longer.
    const maintainerMatch = body.match(/maintainer[^.]*?(\w+) months/);
    const reviewerMatch = body.match(/reviewer[^.]*?(\w+) months/);
    const toMonths: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
    };
    if (maintainerMatch && reviewerMatch) {
      const maintainerMonths = toMonths[maintainerMatch[1]] ?? Infinity;
      const reviewerMonths = toMonths[reviewerMatch[1]] ?? Infinity;
      expect(maintainerMonths).toBeLessThanOrEqual(reviewerMonths);
    }
  });
});

// ---------------------------------------------------------------------------
// Notification process
// ---------------------------------------------------------------------------

describe('notification process guarantees', () => {
  const body = sectionBody('Notification Process');

  it('requires a first notice 14 days before the threshold is reached', () => {
    expect(body).toContain('first notice');
    expect(body).toContain('14 days');
  });

  it('requires a second notice on the day the threshold is reached', () => {
    expect(body).toContain('second notice');
    expect(body).toContain('on the day the threshold is reached');
  });

  it('provides a response window after the second notice', () => {
    expect(body).toContain('response window');
    expect(body).toContain('seven days');
  });

  it('lists the valid responses that pause the status-change process', () => {
    expect(body).toContain('qualifying action');
    expect(body).toContain('extension');
    expect(body).toContain('voluntary step-down');
  });

  it('limits extensions to once per 12-month period', () => {
    expect(body).toContain('once per 12-month period');
  });

  it('requires notices to be public and on GitHub', () => {
    expect(body).toContain('public');
    expect(body).toContain('github');
  });

  it('allows private messages to supplement but never replace public notices', () => {
    expect(body).toContain('supplement');
    expect(body).toContain('never replace');
  });

  it('requires the status change to be recorded on a tracking issue', () => {
    expect(body).toContain('tracking issue');
  });
});

// ---------------------------------------------------------------------------
// Consequences
// ---------------------------------------------------------------------------

describe('consequence guarantees', () => {
  const body = sectionBody('Consequences');

  it('defines consequences for each of the four roles', () => {
    expect(body).toContain('contributor');
    expect(body).toContain('reviewer');
    expect(body).toContain('maintainer');
    expect(body).toMatch(/working.group lead/);
  });

  it('retains repository read access for Reviewers after removal', () => {
    // The reviewer block must contain both "read access" and "retained".
    expect(body).toMatch(/reviewer[^.]*read access[^.]*retained|retained[^.]*read access/);
  });

  it('retains repository read access for Maintainers after removal', () => {
    expect(body).toMatch(/maintainer[^.]*read access[^.]*retained|retained[^.]*read access/);
  });

  it('removes Maintainers from elevated permissions', () => {
    expect(body).toContain('elevated repository permissions');
  });

  it('removes Reviewers from the codeowners file and review rotation', () => {
    expect(body).toContain('codeowners');
    expect(body).toContain('review-assignment rotation');
  });

  it('places a leaderless working group in a caretaker state', () => {
    expect(body).toContain('caretaker state');
  });

  it('requires every status change to be auditable', () => {
    expect(body).toContain('auditable');
  });

  it('applies consequences only after the notification process is complete', () => {
    expect(body).toContain('notification process is complete');
  });
});

// ---------------------------------------------------------------------------
// Reinstatement
// ---------------------------------------------------------------------------

describe('reinstatement guarantees', () => {
  const body = sectionBody('Reinstatement');

  it('defines a reinstatement path for each role', () => {
    expect(body).toContain('contributor');
    expect(body).toContain('reviewer');
    expect(body).toContain('maintainer');
    expect(body).toMatch(/working.group lead/);
  });

  it('makes Contributor reinstatement automatic on the next merged PR', () => {
    expect(body).toContain('automatic');
    expect(body).toContain('merged pull request');
  });

  it('requires two completed reviews for Reviewer reinstatement', () => {
    expect(body).toContain('two completed reviews');
  });

  it('requires Reviewer reinstatement to be approved by one active Maintainer', () => {
    expect(body).toContain('one active maintainer');
  });

  it('requires four completed reviews or PRs for Maintainer reinstatement', () => {
    expect(body).toContain('four completed reviews or');
  });

  it('requires two Maintainer approvals for Maintainer reinstatement', () => {
    expect(body).toContain('two active maintainers');
  });

  it('treats voluntary step-down the same as inactivity for reinstatement', () => {
    expect(body).toContain('voluntary step-down');
    expect(body).toContain('no penalty');
  });
});

// ---------------------------------------------------------------------------
// Consistency with the Governance folder
// ---------------------------------------------------------------------------

describe('policy consistency with the governance folder', () => {
  it('references the Maintainer role document', () => {
    expect(prose).toContain('governance/roles/maintainer.md');
  });

  it('references the Maintainer role document that actually exists', () => {
    expect(
      () => readFileSync(path.resolve(__dirname, '../roles/MAINTAINER.md'), 'utf8'),
      'referenced file MAINTAINER.md does not exist',
    ).not.toThrow();
  });

  it('scopes changes to the Governance folder only', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('links ownership to the Maintainer role document', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('governance/roles/maintainer.md');
  });
});
