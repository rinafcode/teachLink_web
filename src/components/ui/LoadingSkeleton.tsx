'use client';

import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

/**
 * Standardized Loading Skeleton component for consistent placeholders.
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-800';
  const variantClasses = {
    text: 'rounded h-4 w-full mb-2',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} style={style} />;
};

export const CardSkeleton = () => (
  <div className="p-4 border dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 shadow-sm">
    <LoadingSkeleton variant="rectangular" height={160} className="mb-4" />
    <LoadingSkeleton variant="text" width="80%" />
    <LoadingSkeleton variant="text" width="40%" />
    <div className="flex justify-between mt-6">
      <LoadingSkeleton variant="rectangular" width={80} height={32} />
      <LoadingSkeleton variant="circular" width={32} height={32} />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-4 p-3 border dark:border-gray-800 rounded-xl"
      >
        <LoadingSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <LoadingSkeleton variant="text" width="60%" />
          <LoadingSkeleton variant="text" width="30%" />
        </div>
      </div>
    ))}
  </div>
);
