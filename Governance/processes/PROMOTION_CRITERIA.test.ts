/**
 * Regression tests for the Role Promotion Criteria document
 * (Governance/processes/PROMOTION_CRITERIA.md).
 *
 * The document makes concrete, enforceable guarantees: objective
 * criteria for each step on the contributor ladder, a named nominator
 * and approver, and explicit evidence requirements. These tests pin
 * those guarantees to the checked-in document so they cannot silently
 * regress — for example, an edit that removes a criterion, lowers a
 * threshold, or drops the evidence requirement fails CI.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.resolve(__dirname, 'PROMOTION_CRITERIA.md');
const doc = readFileSync(DOC_PATH, 'utf8');

/** Strip Markdown syntax so keyword assertions match prose, not formatting. */
function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1') // inline code keeps its text
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold keeps its text
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2') // links keep text and target
    .replace(/\s+/g, ' ') // line wrapping must not affect prose matching
    .toLowerCase();
}

const prose = plainProse(doc);

/** Every "## Heading" in the document, in order. */
const sections = [...doc.matchAll(/^## (.+)$/gm)].map((m) => m[1]);

/** Extract the body of a single "## Section" (text up to next heading). */
function sectionBody(title: string): string {
  const start = doc.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = doc.indexOf('\n## ', start + 1);
  const body = next === -1 ? doc.slice(start) : doc.slice(start, next);
  return plainProse(body);
}

// ---------------------------------------------------------------------------
// Document structure
// ---------------------------------------------------------------------------

describe('PROMOTION_CRITERIA document structure', () => {
  it('is titled "Role Promotion Criteria"', () => {
    expect(doc.startsWith('# Role Promotion Criteria\n')).toBe(true);
  });

  it('keeps the canonical governance document sections in order', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Criteria by Role',
      'Nomination and Approval',
      'Evidence Requirements',
      'Ownership',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Criteria by Role');
    expect(sections).toContain('Nomination and Approval');
    expect(sections).toContain('Evidence Requirements');
  });

  it('has no unresolved template placeholders', () => {
    expect(doc).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...doc.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

// ---------------------------------------------------------------------------
// Criteria by role
// ---------------------------------------------------------------------------

describe('contributor criteria', () => {
  it('requires at least one merged pull request closing an assigned issue', () => {
    expect(prose).toContain('one merged pull request');
    expect(prose).toContain('closes an assigned issue');
  });

  it('requires adherence to quality gates', () => {
    const required = ['type-check', 'lint', 'build', 'test'];
    for (const gate of required) {
      expect(prose, `must name quality gate ${gate}`).toContain(gate);
    }
  });

  it('requires no unresolved conduct matter', () => {
    expect(prose).toContain('no unresolved conduct matter');
  });

  it('grants the contributor role automatically on first merged pr', () => {
    expect(prose).toContain('granted automatically');
    expect(prose).toContain('no nomination required');
  });
});

describe('reviewer criteria', () => {
  const body = sectionBody('Criteria by Role');

  it('requires at least five merged pull requests', () => {
    expect(body).toContain('five merged pull requests');
  });

  it('requires coverage of at least two different areas of the codebase', () => {
    expect(body).toContain('two different areas');
  });

  it('requires at least five substantive review comments', () => {
    // appears twice (reviewer + maintainer), just check it is present
    expect(body).toContain('five substantive review comments');
  });

  it('requires at least three months of active participation', () => {
    expect(body).toContain('three months of active participation');
  });

  it('requires no gap longer than 30 consecutive days', () => {
    expect(body).toContain('30 consecutive days');
  });
});

describe('maintainer criteria', () => {
  const body = sectionBody('Criteria by Role');

  it('requires at least fifteen merged pull requests', () => {
    expect(body).toContain('fifteen merged pull requests');
  });

  it('requires at least five non-trivial pull requests', () => {
    expect(body).toContain('at least five');
    expect(body).toContain('non-trivial scope');
  });

  it('requires at least twenty substantive review comments', () => {
    expect(body).toContain('twenty substantive review comments');
  });

  it('requires at least five reviews cited as influential', () => {
    expect(body).toContain('five');
    expect(body).toContain('cited as influential');
  });

  it('requires at least six months of active participation at reviewer level', () => {
    expect(body).toContain('six months of active participation');
    expect(body).toContain('reviewer level');
  });

  it('requires availability within escalation response windows', () => {
    expect(body).toContain('escalation_path.md');
  });
});

// ---------------------------------------------------------------------------
// Nomination and approval guarantees
// ---------------------------------------------------------------------------

describe('nomination and approval guarantees', () => {
  const body = sectionBody('Nomination and Approval');

  it('requires a public nomination issue', () => {
    expect(body).toContain('public issue');
  });

  it('requires at least one second within the 10-business-day window', () => {
    expect(body).toContain('at least one second');
    expect(body).toContain('10-business-day');
  });

  it('requires a decision within 5 business days of the window closing', () => {
    expect(body).toContain('5 business days');
    expect(body).toContain('seconding window closing');
  });

  it('allows self-nominations on the same terms', () => {
    expect(body).toContain('self-nominations follow the same process');
  });

  it('approves by simple majority of responding maintainers', () => {
    expect(body).toContain('simple majority');
    expect(body).toContain('abstention is not a no');
  });

  it('defers the full process to nomination.md', () => {
    expect(body).toContain('nomination.md');
  });
});

// ---------------------------------------------------------------------------
// Evidence requirements
// ---------------------------------------------------------------------------

describe('evidence requirement guarantees', () => {
  const body = sectionBody('Evidence Requirements');

  it('requires links to every pull request cited', () => {
    expect(body).toContain('link to each pull request');
    expect(body).toContain('merge date visible');
  });

  it('requires links to every review comment cited', () => {
    expect(body).toContain('link to each review comment');
    expect(body).toContain('pull request visible');
  });

  it('requires a conflict declaration', () => {
    expect(body).toContain('conflict_of_interest.md');
  });

  it('rejects assertions without links', () => {
    expect(body).toContain('assertions without links do not satisfy');
  });

  it('allows evidence added after nomination opens', () => {
    expect(body).toContain('added as a comment on the nomination issue');
    expect(body).toContain('part of the nomination record');
  });
});

// ---------------------------------------------------------------------------
// Consistency with the broader governance folder
// ---------------------------------------------------------------------------

describe('consistency with the governance folder', () => {
  it('defers to the documents it builds on, which must exist', () => {
    const referenced = [
      'NOMINATION.md', // same folder
      'ESCALATION_PATH.md', // same folder
      '../roles/CONTRIBUTOR.md',
      '../roles/TREASURER.md',
      '../policies/CONFLICT_OF_INTEREST.md',
      '../RECOGNITION.md',
      '../CODE_OF_CONDUCT.md',
    ];
    for (const file of referenced) {
      const name = path.basename(file).toLowerCase();
      expect(prose, `must reference ${name}`).toContain(name);
      expect(
        () => readFileSync(path.resolve(__dirname, file), 'utf8'),
      ).not.toThrow();
    }
  });

  it('mentions the governance-folder-only rule for changes to this doc', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('only the governance/ folder');
  });

  it('pins regression coverage to the companion test file', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/processes/promotion_criteria.test.ts');
  });
});
