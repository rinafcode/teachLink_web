import type { Metadata } from 'next';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { OfflineStatusIndicator } from '../../components/offline/OfflineStatusIndicator';
import { DownloadManager } from '../../components/offline/DownloadManager';
import { StorageManager } from '../../components/offline/StorageManager';
import { SyncManager } from '../../components/offline/SyncManager';

export const metadata: Metadata = {
  title: 'Dashboard | TeachLink',
  description: 'Your personalized learning dashboard with statistics, upcoming deadlines, and recommendations.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <OfflineStatusIndicator />
      </div>
      <DashboardGrid />
      <div className="grid gap-6 lg:grid-cols-2">
        <DownloadManager />
        <StorageManager />
      </div>
      <SyncManager />
    </div>
  );
}
