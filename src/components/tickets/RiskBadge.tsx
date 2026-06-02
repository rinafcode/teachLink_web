'use client';

import type { RiskLevel } from '@/lib/tickets/types';

const STYLES: Record<RiskLevel, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
}

export function RiskBadge({ level, score, showScore = false }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[level]}`}
      aria-label={`Risk level: ${level}${
        showScore && score !== undefined ? `, score ${score}` : ''
      }`}
    >
      <span className="capitalize">{level}</span>
      {showScore && score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
