/**
 * Regression tests for the Code Review Policy
 * (Governance/policies/REVIEW_POLICY.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * a review is required before merge, the reviewer must be independent of the
 * change, and a review has a defined scope. These tests pin those guarantees
 * to the checked-in document so they cannot silently regress (for example, an
 * edit that lets an author approve their own pull request or drops a review
 * area fails CI), and they keep the document consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'REVIEW_POLICY.md');
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

describe('REVIEW_POLICY document structure', () => {
  it('is titled "Code Review Policy" like every governance document', () => {
    expect(policy.startsWith('# Code Review Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Review Requirements Before Merge',
      'Reviewer Independence',
      'Review Scope',
      'Required Checks and Regression Testing',
      'Addressing Requested Changes',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Review Requirements Before Merge');
    expect(sections).toContain('Reviewer Independence');
    expect(sections).toContain('Review Scope');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('review-before-merge guarantees', () => {
  const body = sectionBody('Review Requirements Before Merge');

  it('requires at least one approving review from a maintainer or delegate', () => {
    expect(body).toContain('at least one approving review');
    expect(body).toContain('maintainer');
  });

  it('requires reviews to be recorded on the pull request', () => {
    expect(body).toContain('recorded on the pull request');
    expect(body).toContain('does not replace a recorded review');
  });

  it('protects both main and develop and forbids direct pushes', () => {
    expect(body).toContain('main');
    expect(body).toContain('develop');
    expect(body).toContain('direct pushes');
  });

  it('requires an up-to-date branch with resolved conversations', () => {
    expect(body).toContain('up to date');
    expect(body).toContain('resolved');
  });
});

describe('reviewer independence guarantees', () => {
  const body = sectionBody('Reviewer Independence');

  it('forbids authors from approving their own pull request', () => {
    expect(body).toContain('must not approve their own pull request');
    expect(body).toContain('sole reviewer');
  });

  it('treats material contributors as authors for the change', () => {
    expect(body).toContain('contributed materially');
    expect(body).toContain('independent review');
  });

  it('rejects a review that merely restates the author intent', () => {
    expect(body).toContain('restates the author');
  });

  it('requires a recorded exception and retrospective review when independence is impossible', () => {
    expect(body).toContain('exception is called out');
    expect(body).toContain('retrospective review');
  });

  it('applies the same rule to maintainers who author a change', () => {
    expect(body).toContain('maintainer who is also the author');
    expect(body).toContain('another maintainer or delegate');
  });
});

describe('review scope guarantees', () => {
  const body = sectionBody('Review Scope');

  it('requires the six review areas', () => {
    const required = [
      'correctness',
      'tests',
      'security and privacy',
      'maintainability',
      'documentation and configuration',
      'accessibility and performance',
    ];
    for (const area of required) {
      expect(body).toContain(area);
    }
  });

  it('covers the whole change, not only risky lines', () => {
    expect(body).toContain('whole change');
  });

  it('requires reviewers to state what they reviewed', () => {
    expect(body).toContain('which parts of the change they reviewed');
  });
});

describe('required checks and regression testing guarantees', () => {
  const body = sectionBody('Required Checks and Regression Testing');

  it('requires all four mandatory checks to pass before merge', () => {
    expect(body).toContain('type-check');
    expect(body).toContain('lint');
    expect(body).toContain('build');
    expect(body).toContain('test');
    expect(body).toContain('blocks the merge');
  });

  it('expects new behaviour to ship with a regression test', () => {
    expect(body).toContain('regression test');
  });

  it('requires untestable changes to explain the gap on the pull request', () => {
    expect(body).toContain('cannot be tested');
    expect(body).toContain('deliberate and recorded');
  });
});

describe('requested-change guarantees', () => {
  const body = sectionBody('Addressing Requested Changes');

  it('requires every requested change to be answered on the pull request', () => {
    expect(body).toContain('answered on the pull request');
  });

  it('requires a fresh independent review after material edits', () => {
    expect(body).toContain('reviewed again');
    expect(body).toContain('fresh review');
  });

  it('defines when a pull request is ready to merge', () => {
    expect(body).toContain('independent approval');
  });
});

describe('policy consistency with the governance folder', () => {
  it('mentions the governance-folder-only rule for changes to this policy', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('stays self-contained in the Governance folder', () => {
    expect(() => readFileSync(path.resolve(__dirname, '../README.md'), 'utf8')).not.toThrow();
    expect(prose).toContain('governance document');
  });
});
