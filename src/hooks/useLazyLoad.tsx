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

// Cache completed or pending import promises per import function to prevent
// duplicate network requests when preloading the same chunk multiple times.
const importCache = new WeakMap<() => Promise<unknown>, Promise<unknown>>();

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
  if (typeof window === 'undefined') {
    return;
  }

  const existing = importCache.get(importFn);
  if (existing) {
    return existing;
  }

  const promise = Promise.resolve(importFn());
  importCache.set(importFn, promise);

  // If the import fails (network error, syntax error), allow retry.
  promise.catch(() => {
    importCache.delete(importFn);
  });

  return promise;
}

export function createLazy<T>(importFn: () => Promise<any>): React.LazyExoticComponent<T> {
  return lazy(importFn);
}
