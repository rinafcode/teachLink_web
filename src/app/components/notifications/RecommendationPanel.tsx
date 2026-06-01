'use client';

import React from 'react';
import { Lightbulb, X, Check, ChevronRight } from 'lucide-react';
import { NotificationRecommendation } from '@/lib/notifications';

interface RecommendationPanelProps {
  recommendations: NotificationRecommendation[];
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => void;
}

const impactConfig = {
  high: {
    label: 'High impact',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
  medium: {
    label: 'Medium impact',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  low: {
    label: 'Low impact',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
} as const;

export default function RecommendationPanel({
  recommendations,
  onApply,
  onDismiss,
}: RecommendationPanelProps) {
  const [applying, setApplying] = React.useState<string | null>(null);

  if (recommendations.length === 0) return null;

  const handleApply = async (id: string) => {
    setApplying(id);
    try {
      await onApply(id);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="p-4 border-b bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={16} className="text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-900">
          Recommendations
        </h3>
        <span className="ml-auto text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">
          {recommendations.length}
        </span>
      </div>

      {/* Recommendation cards */}
      <div className="space-y-2">
        {recommendations.map((rec) => {
          const impact = impactConfig[rec.impact];
          const isApplying = applying === rec.id;

          return (
            <div
              key={rec.id}
              className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden"
            >
              <div className="p-3">
                {/* Impact badge + title row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${impact.className}`}
                    >
                      {impact.label}
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {rec.title}
                    </p>
                  </div>
                  {/* Dismiss */}
                  <button
                    onClick={() => onDismiss(rec.id)}
                    aria-label={`Dismiss recommendation: ${rec.title}`}
                    className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  {rec.description}
                </p>

                {/* Apply button */}
                <button
                  onClick={() => handleApply(rec.id)}
                  disabled={isApplying}
                  aria-label={`Apply recommendation: ${rec.title}`}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                    transition-colors
                    ${
                      isApplying
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }
                  `}
                >
                  {isApplying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      Applying…
                    </>
                  ) : (
                    <>
                      <Check size={12} />
                      Apply
                      <ChevronRight size={12} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
