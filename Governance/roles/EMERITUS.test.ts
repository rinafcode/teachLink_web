/**
 * Regression tests for the Emeritus Role
 * (Governance/roles/EMERITUS.md).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const DOC_PATH = path.resolve(__dirname, 'EMERITUS.md');
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

describe('EMERITUS role document structure', () => {
  it('is titled "Emeritus Role"', () => {
    expect(doc.startsWith('# Emeritus Role\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Emeritus Status',
      'Retained and Removed Privileges',
      'How the Status Is Granted',
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

describe('emeritus role content requirements', () => {
  it('defines emeritus status as honour-of-active-duty', () => {
    const body = sectionBody('Emeritus Status');
    expect(body).toContain('no longer actively responsible');
    expect(body).toContain('honorary and opt-in');
  });

  it('defines retained and removed privileges', () => {
    const body = sectionBody('Retained and Removed Privileges');
    expect(body).toContain('retained');
    expect(body).toContain('removed');
    expect(body).toContain('attribution');
    expect(body).toContain('decision authority');
    expect(body).toContain('not counted toward quorum');
  });

  it('defines how status is granted', () => {
    const body = sectionBody('How the Status Is Granted');
    expect(body).toContain('request');
    expect(body).toContain('process');
    expect(body).toContain('documentation');
    expect(body).toContain('public issue');
  });

  it('references recognition and nomination processes', () => {
    expect(prose).toContain('governance/recognition.md');
    expect(prose).toContain('governance/processes/nomination.md');
  });

  it('pins regression coverage to companion test', () => {
    const body = sectionBody('Regression Tests');
    expect(body).toContain('governance/roles/emeritus.test.ts');
  });
});
