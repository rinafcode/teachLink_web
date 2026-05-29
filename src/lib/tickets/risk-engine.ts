/**
 * @module tickets/risk-engine
 *
 * Deterministic risk assessment engine for support tickets.
 *
 * Scoring model (0–100):
 *  - Priority weight    : low=5  medium=15  high=30  critical=50
 *  - Category weight    : billing=20  account=15  technical=10  content=5  other=0
 *  - Keyword signals    : security/breach/hack/data loss/payment/fraud keywords add 5–20 pts each
 *  - Description length : very short descriptions (<50 chars) add 5 pts (insufficient detail = risk)
 *
 * Risk level thresholds:
 *  0–24  → low
 *  25–49 → medium
 *  50–74 → high
 *  75+   → critical
 */
import type { RiskAssessment, RiskLevel } from './types';
import type { TicketPriority, TicketCategory } from './types';

const PRIORITY_SCORES: Record<TicketPriority, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 50,
};

const CATEGORY_SCORES: Record<TicketCategory, number> = {
  billing: 20,
  account: 15,
  technical: 10,
  content: 5,
  other: 0,
};

interface KeywordSignal {
  pattern: RegExp;
  score: number;
  label: string;
}

const KEYWORD_SIGNALS: KeywordSignal[] = [
  { pattern: /\b(security|breach|hack|exploit|vulnerability)\b/i, score: 20, label: 'Security concern detected' },
  { pattern: /\b(data.?loss|data.?leak|personal.?data|gdpr|pii)\b/i, score: 20, label: 'Data privacy risk' },
  { pattern: /\b(payment|fraud|charge|refund|billing.?error)\b/i, score: 15, label: 'Financial risk' },
  { pattern: /\b(account.?locked|cannot.?login|access.?denied|unauthorized)\b/i, score: 15, label: 'Access/auth issue' },
  { pattern: /\b(urgent|critical|emergency|asap|immediately)\b/i, score: 10, label: 'User-flagged urgency' },
  { pattern: /\b(crash|down|outage|unavailable|broken)\b/i, score: 10, label: 'Service disruption' },
  { pattern: /\b(multiple.?users|all.?users|everyone|widespread)\b/i, score: 10, label: 'Broad user impact' },
];

function scoreToLevel(score: number): RiskLevel {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export function assessRisk(
  priority: TicketPriority,
  category: TicketCategory,
  title: string,
  description: string,
): RiskAssessment {
  const factors: string[] = [];
  let score = 0;

  // Priority contribution
  const priorityScore = PRIORITY_SCORES[priority];
  score += priorityScore;
  factors.push(`Priority "${priority}" (+${priorityScore})`);

  // Category contribution
  const categoryScore = CATEGORY_SCORES[category];
  if (categoryScore > 0) {
    score += categoryScore;
    factors.push(`Category "${category}" (+${categoryScore})`);
  }

  // Keyword signals on combined text
  const text = `${title} ${description}`;
  for (const signal of KEYWORD_SIGNALS) {
    if (signal.pattern.test(text)) {
      score += signal.score;
      factors.push(`${signal.label} (+${signal.score})`);
    }
  }

  // Short description penalty
  if (description.trim().length < 50) {
    score += 5;
    factors.push('Insufficient description detail (+5)');
  }

  const capped = Math.min(score, 100);

  return {
    level: scoreToLevel(capped),
    score: capped,
    factors,
    assessedAt: Date.now(),
  };
}
