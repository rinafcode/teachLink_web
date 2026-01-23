import type { Metadata } from 'next';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';

export const metadata: Metadata = {
  title: 'Dashboard | TeachLink',
  description: 'Your personalized learning dashboard with statistics, upcoming deadlines, and recommendations.',
};

export default function DashboardPage() {
  return <DashboardGrid />;
}
