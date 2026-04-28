# Feature Flag System Usage Examples

## Basic Usage

```tsx
import { useFeatureFlag } from '@/components/shared/FeatureFlagProvider';

function TippingButton() {
  const isTippingEnabled = useFeatureFlag('TIPPING');

  if (!isTippingEnabled) return null;

  return <button>Send Tip</button>;
}
```

## Conditional Rendering

```tsx
import { useFeatureFlag } from '@/components/shared/FeatureFlagProvider';

function Dashboard() {
  const showOfflineMode = useFeatureFlag('OFFLINE_MODE');
  const showPerformanceAnalytics = useFeatureFlag('PERFORMANCE_ANALYTICS');

  return (
    <div>
      <h1>Dashboard</h1>
      {showOfflineMode && <OfflineModeIndicator />}
      {showPerformanceAnalytics && <PerformanceMetrics />}
    </div>
  );
}
```

## Environment Configuration

Add to your `.env.local`:

```env
# Feature Flags (defaults to true if unset)
NEXT_PUBLIC_FEATURE_TIPPING=true
NEXT_PUBLIC_FEATURE_OFFLINE_MODE=true
NEXT_PUBLIC_FEATURE_PERFORMANCE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_DAO_GOVERNANCE=false
NEXT_PUBLIC_FEATURE_COLLABORATIVE_EDITING=false
```

## Admin Panel

In development mode, a floating admin panel appears in the bottom-right corner allowing you to toggle features in real-time.

## Available Flags

- `TIPPING` - Enable/disable tipping functionality
- `OFFLINE_MODE` - Enable/disable offline capabilities
- `PERFORMANCE_ANALYTICS` - Enable/disable performance monitoring
- `DAO_GOVERNANCE` - Enable/disable DAO features
- `COLLABORATIVE_EDITING` - Enable/disable collaborative editing
