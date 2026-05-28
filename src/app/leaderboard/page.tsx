import type { Metadata } from 'next';
import { LeaderboardConference } from '@/components/leaderboard/LeaderboardConference';

export const metadata: Metadata = {
  title: 'Leaderboard | TeachLink',
  description: 'View top contributors and join live conference sessions on TeachLink.',
};

export default function LeaderboardPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <LeaderboardConference />
    </main>
  );
}
