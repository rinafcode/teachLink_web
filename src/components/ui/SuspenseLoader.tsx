import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface SuspenseLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  minimumDelay?: number;
}

export function SuspenseLoader({ children, fallback, minimumDelay = 200 }: SuspenseLoaderProps) {
  const DefaultFallback = (
    <div className="flex items-center justify-center p-4 min-h-25 animate-in fade-in duration-200">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
      <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
    </div>
  );

  return <Suspense fallback={fallback || DefaultFallback}>{children}</Suspense>;
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
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
    <div className="min-h-screen flex items-center justify-center animate-in fade-in duration-300">
      <div className="text-center space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
