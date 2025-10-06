import type { Metadata } from 'next';
import StudyGroupsPage from '@/app/pages/StudyGroups';

export const metadata: Metadata = {
  title: 'Study Groups | TeachLink',
  description: 'Create and collaborate in study groups with discussions, resources, and challenges.',
};

export default function Page() {
  return <StudyGroupsPage />;
}
