import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LearningChallengeBoard from '@/app/components/social/LearningChallengeBoard';
import type { GroupChallenge } from '@/app/hooks/useStudyGroups';

describe('LearningChallengeBoard', () => {
  it('renders challenge and updates progress', () => {
    const challenges: GroupChallenge[] = [{
      id: 'c1', groupId: 'g1', title: 'Weekly Study', description: '',
      startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86400000).toISOString(),
      target: 100, progress: [], createdAt: new Date().toISOString(),
    }];

    const onCreate = vi.fn();
    const onUpdateProgress = vi.fn();
    const getLeaderboard = vi.fn().mockReturnValue([]);

    render(
      <LearningChallengeBoard
        challenges={challenges}
        onCreate={onCreate}
        onUpdateProgress={onUpdateProgress}
        getLeaderboard={getLeaderboard}
      />
    );

    const input = screen.getByPlaceholderText('Your %');
    fireEvent.change(input, { target: { value: '55' } });

    expect(onUpdateProgress).toHaveBeenCalledWith('c1', 55);
  });
});
