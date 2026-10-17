/**
 * Regression tests for the Secret Rotation Policy
 * (Governance/policies/SECRET_ROTATION.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * a rotation cadence per secret type, a responsible owner, and a verification
 * step. These tests pin those guarantees to the checked-in document so they
 * cannot silently regress, and they keep the document consistent with the rest
 * of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'SECRET_ROTATION.md');
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
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1 $2') // links keep text + target
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

describe('SECRET_ROTATION policy document structure', () => {
  it('is titled "Secret Rotation Policy" like every governance document', () => {
    expect(policy.startsWith('# Secret Rotation Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Rotation Cadence',
      'Responsible Owners',
      'Verification',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Rotation Cadence');
    expect(sections).toContain('Responsible Owners');
    expect(sections).toContain('Verification');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('rotation cadence guarantees', () => {
  const body = sectionBody('Rotation Cadence');

  it('defines a maximum age per secret type', () => {
    expect(body).toContain('maximum age');
  });

  it('defines cadences for high, standard, and low-impact secrets', () => {
    expect(body).toContain('90 days');
    expect(body).toContain('180');
    expect(body).toContain('365');
  });

  it('requires immediate rotation on exit or suspected leak', () => {
    expect(body).toContain('immediately when a holder leaves');
    expect(body).toContain('may have leaked');
  });
});

describe('responsible owner guarantees', () => {
  const body = sectionBody('Responsible Owners');

  it('requires a named owner recorded in the secret inventory', () => {
    expect(body).toContain('named owner');
    expect(body).toContain('secret inventory');
  });

  it('prefers automatic rotation where the provider supports it', () => {
    expect(body).toContain('automatic rotation');
  });
});

describe('verification guarantees', () => {
  const body = sectionBody('Verification');

  it('confirms consumers still work and the old secret does not', () => {
    expect(body).toContain('old secret no longer works');
  });

  it('reconciles the inventory each quarter', () => {
    expect(body).toContain('reconciled');
    expect(body).toContain('quarter');
  });

  it('treats a secret past its maximum age as an incident', () => {
    expect(body).toContain('treated as an incident');
  });
});

describe('secret rotation policy consistency with the rest of Governance', () => {
  it('references the vulnerability disclosure process', () => {
    expect(prose).toContain('vuln_disclosure.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['../processes/VULN_DISCLOSURE.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
