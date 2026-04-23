import { notFound } from 'next/navigation';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';

export default function PerformancePage() {
  const enabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_PERF_DASHBOARD === 'true';

  if (!enabled) {
    notFound();
  }

  return <PerformanceDashboard />;
}
