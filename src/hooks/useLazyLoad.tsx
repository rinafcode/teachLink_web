import React, { lazy, Suspense, ReactNode, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadOptions {
  fallback?: ReactNode;
  name?: string;
}

function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <span className="ml-2 text-gray-500">Loading...</span>
    </div>
  );
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<any>,
  options: LazyLoadOptions = {},
) {
  const { fallback } = options;

  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export function preloadComponent(importFn: () => Promise<unknown>) {
  if (typeof window !== 'undefined') {
    importFn();
  }
}

export function createLazy<T>(importFn: () => Promise<any>): React.LazyExoticComponent<T> {
  return lazy(importFn);
}
