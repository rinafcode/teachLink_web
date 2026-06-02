'use client';

import { useMemo } from 'react';
import { Tag, Gift, Truck } from 'lucide-react';

interface DiscountTier {
  threshold: number;
  label: string;
  reward: string;
  icon: 'shipping' | 'discount' | 'gift';
}

interface DiscountProgressBarProps {
  currentSpend: number;
}

const DISCOUNT_TIERS: DiscountTier[] = [
  {
    threshold: 49.99,
    label: 'Free Support Upgrade',
    reward: 'FREE_SUPPORT',
    icon: 'shipping',
  },
  {
    threshold: 99.99,
    label: '10% Off Your Order',
    reward: '10_PERCENT_OFF',
    icon: 'discount',
  },
  {
    threshold: 149.99,
    label: 'Free Bonus Course',
    reward: 'FREE_COURSE',
    icon: 'gift',
  },
];

const TierIcon = ({ type }: { type: DiscountTier['icon'] }) => {
  const cls = 'w-4 h-4';
  if (type === 'shipping') return <Truck className={cls} />;
  if (type === 'discount') return <Tag className={cls} />;
  return <Gift className={cls} />;
};

export default function DiscountProgressBar({ currentSpend }: DiscountProgressBarProps) {
  const maxThreshold = DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].threshold;
  const normalizedSpend = Math.round(currentSpend * 100) / 100;
  const progressPercent = Math.min((normalizedSpend / maxThreshold) * 100, 100);

  // Find the next tier the user hasn't unlocked yet
  const nextTier = useMemo(
    () => DISCOUNT_TIERS.find((tier) => normalizedSpend < tier.threshold),
    [normalizedSpend],
  );

  // Find all unlocked tiers
  const unlockedTiers = useMemo(
    () => DISCOUNT_TIERS.filter((tier) => normalizedSpend >= tier.threshold),
    [normalizedSpend],
  );

  const amountToNext = nextTier
    ? Math.max(0, nextTier.threshold - normalizedSpend).toFixed(2)
    : null;
  const allUnlocked = !nextTier;

  return (
    <div
      className="mt-6 p-4 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl"
      role="region"
      aria-label="Discount progress"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-[#0F172A] dark:text-white flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-[#0066FF] dark:text-[#00C2FF]" />
          Unlock Discounts
        </h4>
        {allUnlocked ? (
          <span className="text-xs font-bold text-green-600 dark:text-green-400">
            🎉 All rewards unlocked!
          </span>
        ) : (
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            ${amountToNext} away from{' '}
            <span className="font-semibold text-[#0066FF] dark:text-[#00C2FF]">
              {nextTier?.label}
            </span>
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div
        className="relative w-full h-3 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Discount progress: ${Math.round(progressPercent)}%`}
      >
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0066FF] to-[#00C2FF] rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Tier markers */}
        {DISCOUNT_TIERS.map((tier) => {
          const markerPercent = (tier.threshold / maxThreshold) * 100;
          const isUnlocked = currentSpend >= tier.threshold;
          return (
            <div
              key={tier.reward}
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
                isUnlocked
                  ? 'bg-[#00C2FF] border-white dark:border-[#0F172A]'
                  : 'bg-white dark:bg-[#334155] border-[#CBD5E1] dark:border-[#475569]'
              }`}
              style={{ left: `calc(${markerPercent}% - 6px)` }}
              aria-hidden="true"
            />
          );
        })}
      </div>

      {/* Tier list */}
      <ul className="space-y-2">
        {DISCOUNT_TIERS.map((tier) => {
          const isUnlocked = currentSpend >= tier.threshold;
          return (
            <li
              key={tier.reward}
              className={`flex items-center gap-2 text-xs transition-opacity ${
                isUnlocked ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full ${
                  isUnlocked
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                    : 'bg-[#E2E8F0] dark:bg-[#334155] text-[#94A3B8]'
                }`}
              >
                <TierIcon type={tier.icon} />
              </span>
              <span
                className={`font-medium ${
                  isUnlocked
                    ? 'text-green-700 dark:text-green-400 line-through'
                    : 'text-[#475569] dark:text-[#CBD5E1]'
                }`}
              >
                ${tier.threshold.toFixed(2)} — {tier.label}
              </span>
              {isUnlocked && (
                <span className="ml-auto text-green-600 dark:text-green-400 font-bold">
                  ✓ Unlocked
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
