/**
 * Regression tests for the Deprecation Policy (Governance/policies/DEPRECATION.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * minimum notice periods, a mandatory set of communication channels, and a
 * closed list of removal criteria. These tests pin those guarantees to the
 * checked-in document so they cannot silently regress (for example, an edit
 * that waters down the notice period or drops a required channel fails CI),
 * and they keep the document consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'DEPRECATION.md');
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

describe('DEPRECATION policy document structure', () => {
  it('is titled "Deprecation Policy" like every governance document', () => {
    expect(policy.startsWith('# Deprecation Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Deprecation Notice Period',
      'Communication Channels',
      'Removal Criteria',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Deprecation Notice Period');
    expect(sections).toContain('Communication Channels');
    expect(sections).toContain('Removal Criteria');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('deprecation notice period guarantees', () => {
  const body = sectionBody('Deprecation Notice Period');

  it('defines one minor release cycle for user-facing capabilities', () => {
    expect(body).toContain('one minor release cycle');
    expect(body).toContain('user-facing');
  });

  it('defines two minor release cycles for developer-facing interfaces', () => {
    expect(body).toContain('two minor release cycles');
    expect(body).toContain('developer-facing');
  });

  it('starts the notice period at announcement in a release, not at the decision', () => {
    expect(body).toContain('not when the decision is made');
  });

  it('does not allow deprecate-and-immediately-remove breaking changes', () => {
    expect(body).toContain('breaking changes');
    expect(prose).toContain('rfc process');
    expect(body).toMatch(/rejected or redesigned/);
  });

  it('allows shortening only for security or legal reasons, with justification', () => {
    expect(body).toContain('security or legal');
    expect(body).toContain('justified');
  });
});

describe('communication channel guarantees', () => {
  const body = sectionBody('Communication Channels');

  it('requires all four mandatory channels', () => {
    expect(body).toContain('release notes');
    expect(body).toContain('deprecation log');
    expect(body).toContain('console or runtime warnings');
    expect(body).toContain('migration guidance');
  });

  it('requires announcements in the same release that ships the deprecation', () => {
    expect(body).toContain('same release');
  });

  it('requires every announcement to name the item, replacement, and removal release', () => {
    expect(body).toContain('affected item');
    expect(body).toContain('replacement');
    expect(body).toContain('earliest release in which removal may occur');
  });

  it('lets direct messages supplement but never replace the mandatory channels', () => {
    expect(body).toContain('supplement');
    expect(body).toContain('never replace');
  });
});

describe('removal criteria guarantees', () => {
  const body = sectionBody('Removal Criteria');

  it('requires all listed criteria to hold before removal', () => {
    expect(body).toContain('all of the following');
  });

  it('includes the six required criteria', () => {
    const required = [
      'notice period elapsed',
      'replacement available',
      'migration path documented',
      'no blocking usage',
      'tracking issue exists',
      'removal is complete',
    ];
    for (const criterion of required) {
      expect(body).toContain(criterion);
    }
  });

  it('makes removal auditable through a tracking issue', () => {
    expect(body).toContain('auditable');
  });

  it('requires the removal change to clean up documentation, config, and tests', () => {
    expect(body).toContain('documentation');
    expect(body).toContain('dead configuration');
    expect(body).toContain('test scaffolding');
  });

  it('forbids unannounced drive-by removals', () => {
    expect(body).toContain('never shipped as unannounced');
  });
});

describe('policy consistency with the governance folder', () => {
  it('routes un-migratable breaking changes to the RFC process document', () => {
    expect(prose).toContain('governance/processes/rfc_process.md');
    // The referenced governance document must actually exist.
    expect(() =>
      readFileSync(path.resolve(__dirname, '../processes/RFC_PROCESS.md'), 'utf8'),
    ).not.toThrow();
  });

  it('mentions the governance-folder-only rule for changes to this policy', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('applies to surfaces that can actually be deprecated', () => {
    const body = sectionBody('Scope');
    expect(body).toContain('user-facing capabilities');
    expect(body).toContain('components');
    expect(body).toContain('configuration');
    expect(body).toContain('governance documents');
  });
});
