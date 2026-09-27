/**
 * Regression tests for the Code of Conduct Appeals Process
 * (Governance/COC_APPEALS.md).
 *
 * The document is governance, but it makes concrete, enforceable
 * guarantees: who may appeal, the ordered appeal steps, and the
 * independent review requirement. These tests pin those guarantees
 * to the checked-in document so they cannot silently regress (for
 * example, an edit that drops the independent reviewer or removes
 * a filing deadline fails CI), and they keep the document
 * consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'COC_APPEALS.md');
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

describe('COC_APPEALS document structure', () => {
  it('is titled "Code of Conduct Appeals Process"', () => {
    expect(policy.startsWith('# Code of Conduct Appeals Process\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Who May Appeal',
      'Appeal Steps',
      'Independent Review',
      'Confidentiality and Records',
      'Ownership and Review',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Who May Appeal');
    expect(sections).toContain('Appeal Steps');
    expect(sections).toContain('Independent Review');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('who-may-appeal guarantees', () => {
  const body = sectionBody('Who May Appeal');

  it('lets the reported person appeal the decision', () => {
    expect(body).toContain('reported person');
    expect(body).toContain('may appeal');
  });

  it('lets the reporter appeal an incorrect decision', () => {
    expect(body).toContain('reporter');
    expect(body).toContain('incorrect');
  });

  it('lets an affected contributor appeal the outcome', () => {
    expect(body).toContain('affected contributor');
    expect(body).toContain('directly affected');
  });
});

describe('appeal step guarantees', () => {
  const body = sectionBody('Appeal Steps');

  it('requires filing an appeal within 14 calendar days', () => {
    expect(body).toContain('file an appeal');
    expect(body).toContain('14 calendar days');
  });

  it('requires acknowledgement and triage within 3 business days', () => {
    expect(body).toContain('acknowledg');
    expect(body).toContain('3 business days');
  });

  it('routes the appeal to independent review', () => {
    expect(body).toContain('independent reviewer');
    expect(body).toContain('independent review');
  });

  it('requires a written decision with reasoning', () => {
    expect(body).toContain('written decision with reasoning');
  });

  it('records the decision and opens follow-ups without private details', () => {
    expect(body).toContain('record');
    expect(body).toContain('follow-up issue');
  });

  it('completes independent review within 10 business days', () => {
    expect(body).toContain('10 business days');
  });
});

describe('independent review guarantees', () => {
  const body = sectionBody('Independent Review');

  it('requires a reviewer who did not make the original decision', () => {
    expect(body).toContain('did not make the original decision');
    expect(body).toContain('uninvolved');
  });

  it('forbids the author or approver from reviewing their own decision', () => {
    expect(body).toContain('must not have authored');
    expect(body).toContain('must not have been directed');
  });

  it('requires disclosure and recusal on a conflict of interest', () => {
    expect(body).toContain('disclose');
    expect(body).toContain('conflict of interest');
    expect(body).toContain('step aside');
  });

  it('rejects a review that merely restates the original decision', () => {
    expect(body).toContain('merely restates');
  });

  it('requires a retrospective review when independence is delayed', () => {
    expect(body).toContain('retrospective independent review');
    expect(body).toContain('exception is recorded');
  });
});

describe('policy consistency with the governance folder', () => {
  it('mentions the governance-folder-only rule for changes to this process', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('stays self-contained in the Governance folder', () => {
    expect(() => readFileSync(path.resolve(__dirname, 'README.md'), 'utf8')).not.toThrow();
    expect(prose).toContain('governance document');
  });

  it('routes out-of-scope technical disputes to the triage process', () => {
    expect(prose).toContain('governance/processes/triage.md');
    expect(() => readGovernanceDoc('processes/TRIAGE.md')).not.toThrow();
  });

  it('routes comment appeals to the comment moderation policy', () => {
    expect(prose).toContain('governance/domains/comment_moderation.md');
    expect(() => readGovernanceDoc('domains/COMMENT_MODERATION.md')).not.toThrow();
  });

  it('grounds reviewer roles in the maintainer and contributor roles', () => {
    expect(() => readGovernanceDoc('roles/MAINTAINER.md')).not.toThrow();
    expect(prose).toContain('governance/roles/maintainer.md');
  });
});
