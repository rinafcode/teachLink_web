/**
 * Regression tests for the Breaking Change Policy
 * (Governance/policies/BREAKING_CHANGES.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * a closed list of what counts as breaking, a mandatory set of approvals, and
 * a migration-guide requirement. These tests pin those guarantees to the
 * checked-in document so they cannot silently regress (for example, an edit
 * that drops a required approval or waters down the migration guide fails CI),
 * and they keep the document consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'BREAKING_CHANGES.md');
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

describe('BREAKING_CHANGES policy document structure', () => {
  it('is titled "Breaking Change Policy" like every governance document', () => {
    expect(policy.startsWith('# Breaking Change Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'What Counts as Breaking',
      'Required Approvals',
      'Migration Guide Requirement',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('What Counts as Breaking');
    expect(sections).toContain('Required Approvals');
    expect(sections).toContain('Migration Guide Requirement');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('what counts as breaking', () => {
  const body = sectionBody('What Counts as Breaking');

  it('defines breaking as requiring work from someone outside the change', () => {
    expect(body).toContain('requires someone outside the change to do work');
  });

  it('lists the five breaking categories', () => {
    const required = [
      'removal or rename',
      'signature or behaviour change',
      'default change',
      'build and ci entry points',
      'governance documents',
    ];
    for (const category of required) {
      expect(body).toContain(category);
    }
  });

  it('covers the surfaces a consumer can depend on', () => {
    expect(body).toContain('url route');
    expect(body).toContain('components');
    expect(body).toContain('environment variable');
    expect(body).toContain('governance documents');
  });

  it('excludes additive and internal-only changes', () => {
    expect(body).toContain('not breaking');
    expect(body).toContain('adds a new optional capability');
    expect(body).toContain('refactors internals');
  });

  it('treats ambiguous changes as breaking until a maintainer decides', () => {
    expect(body).toContain('ambiguous');
    expect(body).toContain('treated as breaking');
  });
});

describe('required approval guarantees', () => {
  const body = sectionBody('Required Approvals');

  it('requires two maintainer approvals from non-authors', () => {
    expect(body).toContain('two maintainer approvals');
    expect(body).toContain('must not be the author');
  });

  it('requires an accepted RFC before implementation', () => {
    expect(body).toContain('rfc first');
    expect(body).toContain('governance/processes/rfc_process.md');
  });

  it('requires a major version bump', () => {
    expect(body).toContain('major bump');
    expect(body).toContain('governance/policies/versioning.md');
  });

  it('prefers a deprecation cycle where feasible', () => {
    expect(body).toContain('deprecation where possible');
    expect(body).toContain('governance/policies/deprecation.md');
  });

  it('requires release sign-off and recorded approvals', () => {
    expect(body).toContain('release sign-off');
    expect(body).toContain('governance/processes/release_signoff.md');
    expect(body).toContain('does not count');
  });
});

describe('migration guide guarantees', () => {
  const body = sectionBody('Migration Guide Requirement');

  it('requires the guide in the same pull request', () => {
    expect(body).toContain('same pull request');
  });

  it('requires all five guide elements', () => {
    const required = [
      'location',
      'contents',
      'effort estimate',
      'timeline',
      'no guide, no merge',
    ];
    for (const element of required) {
      expect(body).toContain(element);
    }
  });

  it('requires a before-and-after example', () => {
    expect(body).toContain('before-and-after example');
  });

  it('names the introducing release and the removal release', () => {
    expect(body).toContain('release that introduces the change');
    expect(body).toContain('earliest release in which the old surface stops working');
  });

  it('blocks merging a breaking change without a guide', () => {
    expect(body).toContain('not merged');
    expect(body).toContain('regardless of approvals');
  });
});

describe('policy consistency with the governance folder', () => {
  it('references governance documents that actually exist', () => {
    const referenced = [
      '../processes/RFC_PROCESS.md',
      '../processes/RELEASE_SIGNOFF.md',
      '../roles/MAINTAINER.md',
      'VERSIONING.md',
      'DEPRECATION.md',
    ];
    for (const relativePath of referenced) {
      expect(() =>
        readFileSync(path.resolve(__dirname, relativePath), 'utf8'),
      ).not.toThrow();
    }
  });

  it('mentions the governance-folder-only rule for changes to this policy', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('keeps this policy aligned with versioning and deprecation', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('governance/policies/versioning.md');
    expect(body).toContain('governance/policies/deprecation.md');
  });

  it('applies to surfaces that can actually break', () => {
    const body = sectionBody('Scope');
    expect(body).toContain('user-facing capabilities');
    expect(body).toContain('components');
    expect(body).toContain('configuration');
    expect(body).toContain('governance documents');
  });
});
