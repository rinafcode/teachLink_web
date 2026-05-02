import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface SuspenseLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  minimumDelay?: number;
}

export function SuspenseLoader({ children, fallback, minimumDelay = 200 }: SuspenseLoaderProps) {
  const DefaultFallback = (
    <div className="flex items-center justify-center p-4 min-h-25">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
      <span className="text-sm text-gray-500">Loading...</span>
    </div>
  );

  return <Suspense fallback={fallback || DefaultFallback}>{children}</Suspense>;
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

export function InlineLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return <Loader2 className={`${sizes[size]} animate-spin text-blue-500`} />;
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
