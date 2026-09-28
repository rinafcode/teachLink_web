/**
 * Regression tests for the Moderator Role
 * (Governance/roles/MODERATOR.md).
 *
 * The moderator role is governance documentation. These tests pin the
 * canonical structure, required content (duties, powers/limits,
 * appointment/removal), and cross-references to existing policies/processes
 * so edits cannot silently remove critical guarantees. The tests keep
 * the document consistent with the Governance folder's style and rules.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.resolve(__dirname, 'MODERATOR.md');
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
const sections = [...doc.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

/** Extract the body of a single "## Section" (text up to the next heading). */
function sectionBody(title: string): string {
  const start = doc.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = doc.indexOf('\n## ', start + 1);
  const body = next === -1 ? doc.slice(start) : doc.slice(start, next);
  return plainProse(body);
}

describe('MODERATOR role document structure', () => {
  it('is titled "Moderator Role"', () => {
    expect(doc.startsWith('# Moderator Role\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Duties',
      'Moderation Powers and Limits',
      'Appointment and Removal',
      'Ownership',
      'Success',
      'Regression Tests',
      'Revision History',
    ]);
  });

  it('has no unresolved template placeholders', () => {
    expect(doc).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...doc.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('moderator role content requirements', () => {
  it('states duties clearly', () => {
    const body = sectionBody('Duties');
    expect(body).toContain('uphold the code of conduct');
    expect(body).toContain('intervene early');
    expect(body).toContain('document actions');
    expect(body).toContain('collaborate on escalations');
  });

  it('defines powers and limits', () => {
    const body = sectionBody('Moderation Powers and Limits');
    expect(body).toContain('powers');
    expect(body).toContain('limits');
    expect(body).toContain('recuse themselves');
    expect(body).toContain('conflict of interest');
  });

  it('defines appointment and removal via nomination process', () => {
    const body = sectionBody('Appointment and Removal');
    expect(body).toContain('appointment');
    expect(body).toContain('removal');
    expect(body).toContain('governance/processes/nomination.md');
    expect(body).toContain('motion to revoke the role');
    expect(body).toContain('self-nominations');
  });

  it('references moderation policy and escalation paths', () => {
    expect(prose).toContain('governance/policies/moderation.md');
    expect(prose).toContain('governance/processes/escalation_path.md');
    expect(prose).toContain('governance/processes/conflict_resolution.md');
    expect(prose).toContain('governance/domains/comment_moderation.md');
    expect(prose).toContain('governance/code_of_conduct.md');
  });

  it('limits changes to governance folder only', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('governance/');
  });

  it('pins regression coverage to the companion test file', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/roles/moderator.test.ts');
  });
});
