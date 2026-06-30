'use client';

import { memo } from 'react';
import type { Achievement } from '../profile-data';
import { achievements } from '../profile-data';

interface AchievementCardProps {
  achievement: Achievement;
}

const AchievementCard = memo(function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 p-4 text-center">
      <div className="mb-2 text-4xl" aria-hidden="true">
        {achievement.icon}
      </div>
      <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
      <p className="text-sm text-gray-500">{achievement.description}</p>
      <p className="mt-1 text-xs text-gray-400">{achievement.earnedAt}</p>
    </article>
  );
});

function AchievementsPanel() {
  return (
    <section
      id="achievements-panel"
      role="tabpanel"
      aria-labelledby="achievements-tab"
      className="rounded-lg bg-white p-6 shadow"
    >
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Achievements</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </section>
  );
}

export default memo(AchievementsPanel);
