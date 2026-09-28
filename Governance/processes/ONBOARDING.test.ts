/**
 * Regression tests for the Contributor Onboarding Process
 * (Governance/processes/ONBOARDING.md).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.resolve(__dirname, 'ONBOARDING.md');
const doc = readFileSync(DOC_PATH, 'utf8');

function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const prose = plainProse(doc);
const sections = [...doc.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

function sectionBody(title: string): string {
  const start = doc.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = doc.indexOf('\n## ', start + 1);
  const body = next === -1 ? doc.slice(start) : doc.slice(start, next);
  return plainProse(body);
}

describe('ONBOARDING process document structure', () => {
  it('is titled "Contributor Onboarding Process"', () => {
    expect(doc.startsWith('# Contributor Onboarding Process\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Onboarding Steps',
      'Resources a New Contributor Receives',
      'Who Owns Onboarding',
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

describe('onboarding process content requirements', () => {
  it('lists onboarding steps clearly', () => {
    const body = sectionBody('Onboarding Steps');
    expect(body).toContain('orientation');
    expect(body).toContain('find a suitable issue');
    expect(body).toContain('get assigned');
    expect(body).toContain('set up locally');
    expect(body).toContain('implement and test');
    expect(body).toContain('submit for review');
  });

  it('specifies resources received', () => {
    const body = sectionBody('Resources a New Contributor Receives');
    expect(body).toContain('clear entry points');
    expect(body).toContain('project documentation');
    expect(body).toContain('feedback loops');
    expect(body).toContain('mentorship guidance');
  });

  it('defines ownership model', () => {
    const body = sectionBody('Who Owns Onboarding');
    expect(body).toContain('maintainers');
    expect(body).toContain('new contributors');
  });

  it('references key policies and resources', () => {
    expect(prose).toContain('governance/roles/contributor.md');
    expect(prose).toContain('contributing.md');
    expect(prose).toContain('governance/policies/first_time_contributor.md');
    expect(prose).toContain('governance/policies/good_first_issue.md');
    expect(prose).toContain('governance/policies/review_sla.md');
    expect(prose).toContain('governance/processes/triage.md');
  });

  it('pins regression coverage to companion test', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/processes/onboarding.test.ts');
  });
});
