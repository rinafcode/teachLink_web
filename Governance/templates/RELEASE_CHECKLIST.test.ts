/**
 * Regression tests for the Release Checklist Template
 * (Governance/templates/RELEASE_CHECKLIST.md).
 *
 * The template is documentation, but it makes concrete, enforceable guarantees:
 * an ordered set of pre-release steps, a closed list of sign-off gates, and a
 * set of post-release steps. These tests pin those guarantees to the checked-in
 * document so they cannot silently regress (for example, an edit that drops a
 * sign-off gate or removes the post-release verification fails CI), and they
 * keep the template consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const TEMPLATE_PATH = path.resolve(__dirname, 'RELEASE_CHECKLIST.md');
const template = readFileSync(TEMPLATE_PATH, 'utf8');

/** Strip Markdown syntax so keyword assertions match prose, not formatting. */
function plainProse(markdown: string): string {
  return markdown
    .replace(/`([^`]*)`/g, '$1') // inline code keeps its text
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold keeps its text
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2') // links keep text and target
    .replace(/\s+/g, ' ') // line wrapping must not affect prose matching
    .toLowerCase();
}

const prose = plainProse(template);

/** Every "## Heading" in the document, in order. */
const sections = [...template.matchAll(/^## (.+)$/gm)].map((match) => match[1]);

/** Extract the body of a single "## Section" (text up to the next heading). */
function sectionBody(title: string): string {
  const start = template.indexOf(`## ${title}\n`);
  expect(start, `section "${title}" is missing`).toBeGreaterThanOrEqual(0);
  const next = template.indexOf('\n## ', start + 1);
  const body = next === -1 ? template.slice(start) : template.slice(start, next);
  return plainProse(body);
}

describe('RELEASE_CHECKLIST template document structure', () => {
  it('is titled "Release Checklist Template" like every governance document', () => {
    expect(template.startsWith('# Release Checklist Template\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'How to Use This Checklist',
      'Release Identification',
      'Pre-Release Steps',
      'Sign-Off Gates',
      'Release Steps',
      'Post-Release Steps',
      'Ownership',
      'Success',
      'Revision history',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Pre-Release Steps');
    expect(sections).toContain('Sign-Off Gates');
    expect(sections).toContain('Post-Release Steps');
  });

  it('has no unresolved template placeholders outside the fillable fields', () => {
    // The template is a form, so `<placeholder>` fields are expected; what must
    // never appear is an unresolved authoring marker.
    expect(template).not.toMatch(/TBD|TODO|FIXME|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...template.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('pre-release step guarantees', () => {
  const body = sectionBody('Pre-Release Steps');

  it('requires the required checks to pass on the release commit', () => {
    expect(body).toContain('type-check');
    expect(body).toContain('lint');
    expect(body).toContain('build');
    expect(body).toContain('test');
  });

  it('requires the security audit to pass before the cut', () => {
    expect(body).toContain('security audit');
    expect(body).toContain('high or critical');
  });

  it('requires deprecations to be announced with their removal release', () => {
    expect(body).toContain('deprecation');
    expect(body).toContain('earliest release in which removal may occur');
  });

  it('requires documentation to be updated in the same pull requests', () => {
    expect(body).toContain('documentation');
    expect(body).toContain('same pull requests');
  });

  it('requires a known rollback path', () => {
    expect(body).toContain('rollback');
  });
});

describe('sign-off gate guarantees', () => {
  const body = sectionBody('Sign-Off Gates');

  it('requires the three named sign-offs', () => {
    expect(body).toContain('lead maintainer sign-off');
    expect(body).toContain('qa lead sign-off');
    expect(body).toContain('product manager sign-off');
  });

  it('gives the Lead Maintainer final authority', () => {
    expect(body).toContain('final authority');
  });

  it('requires the code review, security scan, and documentation gates', () => {
    expect(body).toContain('code review gate');
    expect(body).toContain('security scan gate');
    expect(body).toContain('documentation gate');
  });

  it('requires the freeze to be respected after the cut', () => {
    expect(body).toContain('freeze respected');
  });
});

describe('post-release step guarantees', () => {
  const body = sectionBody('Post-Release Steps');

  it('requires the deployed version and core flows to be verified', () => {
    expect(body).toContain('deployed version is verified');
    expect(body).toContain('core flows are verified');
  });

  it('requires the error tracker and performance budget to be checked', () => {
    expect(body).toContain('error tracker is checked');
    expect(body).toContain('performance budget is checked');
  });

  it('requires the verification result to be recorded on the tracking issue', () => {
    expect(body).toContain('verification result is recorded');
    expect(body).toContain('release tracking issue');
  });

  it('requires follow-ups to be filed as their own issues', () => {
    expect(body).toContain('follow-ups are filed');
  });
});

describe('template consistency with the governance folder', () => {
  it('routes the release schedule to the release cadence process document', () => {
    expect(prose).toContain('governance/processes/release_cadence.md');
    expect(() =>
      readFileSync(
        path.resolve(__dirname, '../processes/RELEASE_CADENCE.md'),
        'utf8',
      ),
    ).not.toThrow();
  });

  it('routes the sign-off gates to the release sign-off process document', () => {
    expect(prose).toContain('governance/processes/release_signoff.md');
    expect(() =>
      readFileSync(
        path.resolve(__dirname, '../processes/RELEASE_SIGNOFF.md'),
        'utf8',
      ),
    ).not.toThrow();
  });

  it('routes the version number to the versioning policy document', () => {
    expect(prose).toContain('governance/policies/versioning.md');
    expect(() =>
      readFileSync(
        path.resolve(__dirname, '../policies/VERSIONING.md'),
        'utf8',
      ),
    ).not.toThrow();
  });

  it('mentions the governance-folder-only rule for changes to this template', () => {
    const body = sectionBody('Ownership');
    expect(body).toContain('only the governance/ folder');
  });
});
