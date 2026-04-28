'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
    role="status"
    aria-label={title}
  >
    {Icon && (
      <Icon size={48} className="text-gray-300 dark:text-gray-600 mb-4" aria-hidden="true" />
    )}
    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{title}</p>
    {description && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{description}</p>}
    {action}
  </div>
);
