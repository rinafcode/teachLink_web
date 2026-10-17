/**
 * Regression tests for the Certificate Management Policy
 * (Governance/policies/CERTIFICATE_MANAGEMENT.md).
 *
 * The policy is documentation, but it makes concrete, enforceable guarantees:
 * issuance and renewal rules, certificate ownership, and expiry monitoring.
 * These tests pin those guarantees to the checked-in document so they cannot
 * silently regress, and they keep the document consistent with the rest of
 * `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'CERTIFICATE_MANAGEMENT.md');
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

describe('CERTIFICATE_MANAGEMENT policy document structure', () => {
  it('is titled "Certificate Management Policy"', () => {
    expect(policy.startsWith('# Certificate Management Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Issuance and Renewal',
      'Certificate Ownership',
      'Expiry Monitoring',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Issuance and Renewal');
    expect(sections).toContain('Certificate Ownership');
    expect(sections).toContain('Expiry Monitoring');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('issuance and renewal guarantees', () => {
  const body = sectionBody('Issuance and Renewal');

  it('issues only from an approved certificate authority', () => {
    expect(body).toContain('approved certificate authority');
  });

  it('records every issuance in the certificate inventory', () => {
    expect(body).toContain('certificate inventory');
    expect(body).toContain('expiry date');
  });

  it('starts renewal early and prefers automation', () => {
    expect(body).toContain('renewal starts early');
    expect(body).toContain('automated renewal');
  });

  it('deploys a renewed certificate everywhere the old one was used', () => {
    expect(body).toContain('deployed to every place');
  });
});

describe('certificate ownership guarantees', () => {
  const body = sectionBody('Certificate Ownership');

  it('requires exactly one accountable owner per certificate', () => {
    expect(body).toContain('exactly one accountable owner');
    expect(body).toContain('recorded in the inventory');
  });

  it('treats an unowned certificate as a defect', () => {
    expect(body).toContain('treated as a defect');
  });
});

describe('expiry monitoring guarantees', () => {
  const body = sectionBody('Expiry Monitoring');

  it('monitors expiry automatically for every certificate', () => {
    expect(body).toContain('monitored automatically');
    expect(body).toContain('every certificate');
  });

  it('fires alerts at fixed thresholds and treats expiry as an incident', () => {
    expect(body).toContain('fixed thresholds');
    expect(body).toContain('treated as an incident');
  });

  it('reconciles the inventory against what is served', () => {
    expect(body).toContain('reconciled');
  });
});

describe('certificate policy consistency with the rest of Governance', () => {
  it('references the key management policy for private keys', () => {
    expect(prose).toContain('key_management.md');
  });

  it('points at documents that actually exist', () => {
    for (const relativePath of ['KEY_MANAGEMENT.md']) {
      expect(() => readGovernanceDoc(relativePath)).not.toThrow();
    }
  });
});
