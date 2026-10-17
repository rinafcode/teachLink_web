/**
 * Regression tests for the Key Management Policy
 * (Governance/policies/KEY_MANAGEMENT.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * a defined key lifecycle, storage and access rules, and rotation and
 * revocation rules. These tests pin those guarantees to the checked-in
 * document so they cannot silently regress, and they keep the document
 * consistent with the rest of `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'KEY_MANAGEMENT.md');
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

describe('KEY_MANAGEMENT policy document structure', () => {
  it('is titled "Key Management Policy" like every governance document', () => {
    expect(policy.startsWith('# Key Management Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Key Lifecycle',
      'Storage and Access',
      'Rotation and Revocation',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Key Lifecycle');
    expect(sections).toContain('Storage and Access');
    expect(sections).toContain('Rotation and Revocation');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('key lifecycle guarantees', () => {
  const body = sectionBody('Key Lifecycle');

  it('requires an approved algorithm and a named owner per key', () => {
    expect(body).toContain('approved algorithm');
    expect(body).toContain('named owner');
  });

  it('requires a retirement condition before first use', () => {
    expect(body).toContain('retirement condition');
  });

  it('forbids reusing one key across services or environments', () => {
    expect(body).toContain('reusing one key');
  });
});

describe('storage and access guarantees', () => {
  const body = sectionBody('Storage and Access');

  it('forbids committing or pasting private key material', () => {
    expect(body).toContain('never committed to the repository');
    expect(body).toContain('plaintext');
  });

  it('requires a secrets manager or hardware token, encrypted at rest', () => {
    expect(body).toContain('secrets manager');
    expect(body).toContain('hardware token');
    expect(body).toContain('encrypted at rest');
  });

  it('requires every private-key read to be logged', () => {
    expect(body).toContain('logged');
  });
});

describe('rotation and revocation guarantees', () => {
  const body = sectionBody('Rotation and Revocation');

  it('requires rotation on a cadence and on exit or exposure', () => {
    expect(body).toContain('rotated on the cadence');
    expect(body).toContain('holder leaves');
  });

  it('requires the old key to be destroyed after rotation', () => {
    expect(body).toContain('destroys the old key');
  });

  it('defines revocation as the fast incident path with a recorded reason', () => {
    expect(body).toContain('revocation');
    expect(body).toContain('records the reason');
  });
});

describe('key policy consistency with the rest of Governance', () => {
  it('references the certificate management policy', () => {
    expect(prose).toContain('certificate_management.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['CERTIFICATE_MANAGEMENT.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
