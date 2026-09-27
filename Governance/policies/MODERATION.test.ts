/**
 * Regression tests for the Moderation Policy
 * (Governance/policies/MODERATION.md).
 *
 * The policy is documentation, but it makes concrete, enforceable
 * guarantees: the principles moderators follow, the graduated actions
 * they may take, and the transparency they owe. These tests pin those
 * guarantees to the checked-in document so they cannot silently regress
 * (for example, an edit that drops an action level or removes the appeal
 * route fails CI), and they keep the document consistent with `Governance/`.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const POLICY_PATH = path.resolve(__dirname, 'MODERATION.md');
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

describe('MODERATION policy document structure', () => {
  it('is titled "Moderation Policy" like every governance document', () => {
    expect(policy.startsWith('# Moderation Policy\n')).toBe(true);
  });

  it('keeps the canonical governance document sections', () => {
    expect(sections).toEqual([
      'Purpose',
      'Scope',
      'Moderation Principles',
      'Actions Available to Moderators',
      'Transparency Expectations',
      'Ownership and Review',
      'Success',
    ]);
  });

  it('covers the three areas the issue requires', () => {
    expect(sections).toContain('Moderation Principles');
    expect(sections).toContain('Actions Available to Moderators');
    expect(sections).toContain('Transparency Expectations');
  });

  it('has no unresolved template placeholders', () => {
    expect(policy).not.toMatch(/TBD|TODO|FIXME|<[a-z-]+>|XXX/);
  });

  it('stays within the house documentation line width (max 82 columns)', () => {
    const longest = Math.max(...policy.split('\n').map((line) => line.length));
    expect(longest).toBeLessThanOrEqual(82);
  });
});

describe('moderation principles guarantees', () => {
  const body = sectionBody('Moderation Principles');

  it('requires the six moderation principles', () => {
    const required = [
      'fairness',
      'proportionality',
      'consistency and predictability',
      'safety first',
      'accountability and appealability',
      'privacy-preserving',
    ];
    for (const principle of required) {
      expect(body).toContain(principle);
    }
  });

  it('requires least-intrusive means and escalation only with cause', () => {
    expect(body).toContain('smallest effective action first');
    expect(body).toContain('escalate only');
  });

  it('lets safety and legal compliance override other principles', () => {
    expect(body).toContain('no principle overrides safety');
    expect(body).toContain('legal compliance');
  });

  it('requires trade-offs to be explained in the decision record', () => {
    expect(body).toContain('explained in the decision record');
  });
});

describe('moderator action guarantees', () => {
  const body = sectionBody('Actions Available to Moderators');

  it('defines a graduated ladder of five action levels', () => {
    const required = [
      'reminder and guidance',
      'warning',
      'hide or remove content',
      'rate-limit or temporary restriction',
      'referral to conduct enforcement',
    ];
    for (const action of required) {
      expect(body).toContain(action);
    }
  });

  it('starts low and moves up only for severe, repeated, or unremedied cases', () => {
    expect(body).toContain('start low');
    expect(body).toContain('severe, repeated, or unremedied');
  });

  it('forbids moderators from imposing permanent removals alone', () => {
    expect(body).toContain('do not impose permanent removals alone');
    expect(body).toContain('require a conduct enforcement decision');
  });

  it('records every action above a reminder with content, reason, and owner', () => {
    expect(body).toContain('recorded with the content reference');
    expect(body).toContain('criterion violated');
    expect(body).toContain('moderator');
  });

  it('treats knowingly false reports as a conduct matter', () => {
    expect(body).toContain('knowingly false reports');
    expect(body).toContain('conduct matter');
  });
});

describe('transparency expectation guarantees', () => {
  const body = sectionBody('Transparency Expectations');

  it('requires a decision notice with content, reason, action, and appeal', () => {
    expect(body).toContain('what content was acted on');
    expect(body).toContain('which criterion it violated');
    expect(body).toContain('what action was taken');
    expect(body).toContain('how to appeal');
  });

  it('keeps reports and personal detail private by default', () => {
    expect(body).toContain('stay confidential');
    expect(body).toContain('never names or private details');
  });

  it('keeps an auditable minimum record retained by maintainers', () => {
    expect(body).toContain('auditable record');
    expect(body).toContain('retained by maintainers');
  });

  it('summarizes activity in aggregate reporting without identifying anyone', () => {
    expect(body).toContain('aggregate transparency reporting');
    expect(body).toContain('without identifying individuals');
  });

  it('versions policy changes instead of applying them silently', () => {
    expect(body).toContain('never applied silently');
  });
});

describe('policy consistency with the governance folder', () => {
  it('defers comment specifics to the comment moderation domain document', () => {
    expect(prose).toContain('governance/domains/comment_moderation.md');
    // The referenced governance document must actually exist.
    expect(() =>
      readFileSync(
        path.resolve(__dirname, '../domains/COMMENT_MODERATION.md'),
        'utf8',
      ),
    ).not.toThrow();
  });

  it('mentions the governance-folder-only rule for changes to this policy', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('only the governance/ folder');
  });

  it('is versioned with the repository as a real process description', () => {
    const body = sectionBody('Ownership and Review');
    expect(body).toContain('versioned with the repository');
    expect(body).toContain('actually follows');
  });
});
