/**
 * Regression tests for the Approval Requirements Policy
 * (Governance/policies/APPROVAL_REQUIREMENTS.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * every change type has a minimum number of approvals, the required checks
 * must pass with those approvals, and overrides are narrow, recorded, and
 * never waive reviewer independence. These tests pin those guarantees to the
 * checked-in document so they cannot silently regress (for example, an edit
 * that drops the emergency-hotfix retrospective review or lets a security
 * change fall below two approvals fails CI), and they keep the document
 * consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'APPROVAL_REQUIREMENTS.md');
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

describe('APPROVAL_REQUIREMENTS document structure', () => {
  it('is titled "Approval Requirements Policy" like every governance document', () => {
    expect(policy.startsWith('# Approval Requirements Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Change Types and Minimum Approvals',
      'Required Checks',
      'Override Rules',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Change Types and Minimum Approvals');
    expect(sections).toContain('Required Checks');
    expect(sections).toContain('Override Rules');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('minimum approvals per change type', () => {
  const body = sectionBody('Change Types and Minimum Approvals');

  it('names every governed change type', () => {
    const types = [
      'governance documentation',
      'documentation and non-code assets',
      'routine application change',
      'breaking change',
      'security-sensitive change',
      'release and hotfix change',
      'dependency and build configuration change',
    ];
    for (const type of types) {
      expect(body).toContain(type);
    }
  });

  it('requires one maintainer approval for governance-only changes', () => {
    expect(body).toContain('one maintainer approval');
    expect(body).toContain('governance/');
  });

  it('requires two approvals for routine application changes', () => {
    expect(body).toContain('one maintainer');
    expect(body).toContain('one additional independent approval');
  });

  it('requires two maintainer approvals for breaking changes', () => {
    expect(body).toContain('two maintainer approvals');
    expect(body).toContain('breaking-change policy');
  });

  it('requires a security-accountable approver for security-sensitive changes', () => {
    expect(body).toContain('accountable for security');
  });

  it('collects the highest floor when a change spans several types', () => {
    expect(body).toContain('highest');
    expect(body).toContain('spans several change types');
  });

  it('does not let a split route a governed change past its approvals', () => {
    expect(body).toContain('must not be used to route a governed change');
  });
});

describe('required checks guarantees', () => {
  const body = sectionBody('Required Checks');

  it('requires all four mandatory checks on the approved and head commits', () => {
    expect(body).toContain('type-check');
    expect(body).toContain('lint');
    expect(body).toContain('build');
    expect(body).toContain('test');
    expect(body).toContain('blocks the merge');
  });

  it('requires companion governance tests to keep passing', () => {
    expect(body).toContain('companion test');
    expect(body).toContain('silently regress');
  });

  it('requires unrun checks to be explained rather than assumed', () => {
    expect(body).toContain('which check was not run');
    expect(body).toContain('approve with that gap recorded');
  });
});

describe('override rules guarantees', () => {
  const body = sectionBody('Override Rules');

  it('allows an emergency hotfix but requires a later retrospective review', () => {
    expect(body).toContain('emergency hotfix');
    expect(body).toContain('retrospective independent review');
    expect(body).toContain('after the fix ships');
  });

  it('allows a recorded single-approval merge when reviewers are unavailable', () => {
    expect(body).toContain('reviewer unavailability');
    expect(body).toContain('single-approval merge');
    expect(body).toContain('recorded on the pull request');
  });

  it('records delegation to a named, independent reviewer', () => {
    expect(body).toContain('delegation');
    expect(body).toContain('named reviewer');
    expect(body).toContain('independent of the change');
  });

  it('keeps independence, security, and checks non-overridable', () => {
    expect(body).toContain('non-overridable rules');
    expect(body).toContain('approve their own pull request');
    expect(body).toContain('failing required check');
    expect(body).toContain('may not drop below two approvals');
    expect(body).toContain('protected branch');
  });
});

describe('policy consistency with the governance folder', () => {
  it('limits changes to this policy to the Governance folder', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('stays self-contained in the Governance folder', () => {
    expect(() => readFileSync(path.resolve(__dirname, '../README.md'), 'utf8')).not.toThrow();
    expect(prose).toContain('governance document');
  });
});
