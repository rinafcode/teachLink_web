'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export const DashboardWidgetSkeleton: React.FC<{ height?: string; className?: string }> = ({ 
  height = 'h-64', 
  className = '' 
}) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="40%" height={24} />
      <Skeleton width={24} height={24} variant="circle" />
    </div>
    <div className={`flex flex-col gap-4 ${height}`}>
      <Skeleton height="100%" />
    </div>
  </div>
);

export const SummaryWidgetSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width={40} height={40} variant="circle" />
      <Skeleton width={60} height={16} />
    </div>
    <Skeleton width="70%" height={32} className="mb-2" />
    <Skeleton width="40%" height={14} />
  </div>
);

export const ListWidgetSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full">
    <div className="flex items-center justify-between mb-6">
      <Skeleton width="30%" height={24} />
      <Skeleton width="15%" height={16} />
    </div>
    <div className="space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton width={40} height={40} variant="circle" className="flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={10} />
          </div>
          <Skeleton width={48} height={16} />
        </div>
      ))}
    </div>
  </div>
);

export const ChartWidgetSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full">
    <div className="flex items-center justify-between mb-8">
      <div className="space-y-2">
        <Skeleton width={120} height={20} />
        <Skeleton width={80} height={12} />
      </div>
      <div className="flex gap-2">
        <Skeleton width={64} height={32} />
        <Skeleton width={64} height={32} />
      </div>
    </div>
    <div className="flex items-end space-x-4 h-48 pt-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1" 
          height={`${Math.random() * 60 + 20}%`} 
        />
      ))}
    </div>
    <div className="mt-6 flex justify-between">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} width={40} height={10} />
      ))}
    </div>
  </div>
);
