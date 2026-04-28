import { FeatureFlagExample } from '@/components/shared/FeatureFlagExample';

export default function FeatureFlagsDemo() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Feature Flags Demo</h1>
        <p className="mt-2 text-gray-600">
          This page demonstrates the feature flag system. In development mode, 
          use the floating admin panel to toggle features in real-time.
        </p>
      </div>
      
      <FeatureFlagExample />
      
      <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
          💡 Development Tip
        </h3>
        <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
          Look for the floating "Flags" button in the bottom-right corner to toggle features.
          This admin panel only appears in development mode.
        </p>
      </div>
    </div>
  );
}