import React from 'react';
import { Skeleton } from './Skeleton';

type ServerlessSkeletonVariant = 'generic' | 'dashboard' | 'courses' | 'search' | 'profile';

interface ServerlessPageSkeletonProps {
  variant?: ServerlessSkeletonVariant;
  label?: string;
}

const containerClasses =
  'min-h-screen bg-gray-50 p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100';
const surfaceClasses = 'bg-white shadow-sm dark:bg-gray-800';

function LoadingRegion({
  label,
  children,
  maxWidth = 'max-w-7xl',
}: {
  label: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className={containerClasses}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div className={`${maxWidth} mx-auto`}>{children}</div>
    </section>
  );
}

function HeaderSkeleton({ titleWidth = 192, subtitleWidth = 128 }) {
  return (
    <div className="mb-8 space-y-2">
      <Skeleton height={32} width={titleWidth} animation="wave" />
      <Skeleton height={16} width={subtitleWidth} animation="wave" />
    </div>
  );
}

function MetricGrid() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`${surfaceClasses} rounded-xl p-6`}>
          <Skeleton height={16} width={80} className="mb-3" animation="wave" />
          <Skeleton height={32} width={64} animation="wave" />
        </div>
      ))}
    </div>
  );
}

function CardGrid({ cards = 6, imageHeight = 160 }: { cards?: number; imageHeight?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className={`${surfaceClasses} overflow-hidden rounded-xl`}>
          <Skeleton height={imageHeight} className="rounded-none" animation="wave" />
          <div className="space-y-3 p-5">
            <Skeleton height={20} width="75%" animation="wave" />
            <Skeleton height={16} width="100%" animation="wave" />
            <Skeleton height={16} width="65%" animation="wave" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton height={24} width={64} animation="wave" />
              <Skeleton height={32} width={96} animation="wave" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="mb-6 flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} height={40} width={96} animation="wave" />
      ))}
    </div>
  );
}

function SearchRows() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className={`${surfaceClasses} rounded-xl p-4`}>
          <div className="flex gap-4">
            <Skeleton height={96} width={128} className="shrink-0" animation="wave" />
            <div className="flex-1 space-y-2">
              <Skeleton height={20} width="75%" animation="wave" />
              <Skeleton height={16} width="100%" animation="wave" />
              <Skeleton height={16} width="50%" animation="wave" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className={`${surfaceClasses} mb-6 rounded-xl p-6`}>
        <div className="flex items-center gap-6">
          <Skeleton height={96} width={96} variant="circle" animation="wave" />
          <div className="flex-1 space-y-2">
            <Skeleton height={24} width={192} animation="wave" />
            <Skeleton height={16} width={128} animation="wave" />
            <Skeleton height={16} width={256} animation="wave" />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={`${surfaceClasses} rounded-xl p-4`}>
            <Skeleton height={16} width={80} className="mb-2" animation="wave" />
            <Skeleton height={32} width={48} animation="wave" />
          </div>
        ))}
      </div>

      <div className={`${surfaceClasses} rounded-xl p-6`}>
        <div className="mb-6 flex gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={24} width={80} animation="wave" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} height={64} animation="wave" />
          ))}
        </div>
      </div>
    </>
  );
}

export function ServerlessPageSkeleton({
  variant = 'generic',
  label = 'Loading page content',
}: ServerlessPageSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <LoadingRegion label={label}>
        <HeaderSkeleton />
        <MetricGrid />
        <CardGrid />
      </LoadingRegion>
    );
  }

  if (variant === 'courses') {
    return (
      <LoadingRegion label={label}>
        <HeaderSkeleton titleWidth={160} subtitleWidth={256} />
        <FilterSkeleton />
        <CardGrid imageHeight={192} />
      </LoadingRegion>
    );
  }

  if (variant === 'search') {
    return (
      <LoadingRegion label={label} maxWidth="max-w-4xl">
        <Skeleton height={48} className="mb-6" animation="wave" />
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} height={32} width={80} className="rounded-full" animation="wave" />
          ))}
        </div>
        <Skeleton height={20} width={128} className="mb-4" animation="wave" />
        <SearchRows />
      </LoadingRegion>
    );
  }

  if (variant === 'profile') {
    return (
      <LoadingRegion label={label} maxWidth="max-w-4xl">
        <ProfileSkeleton />
      </LoadingRegion>
    );
  }

  return (
    <LoadingRegion label={label}>
      <HeaderSkeleton />
      <CardGrid cards={3} />
    </LoadingRegion>
  );
}

export default ServerlessPageSkeleton;
