import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudyGroupCard from '@/app/components/social/StudyGroupCard';
import type { StudyGroup } from '@/app/hooks/useStudyGroups';

const group: StudyGroup = {
  id: 'g1',
  name: 'Math Club',
  description: 'Algebra focus',
  ownerId: 'u1',
  members: [{ id: 'u1', name: 'Alice' }],
  createdAt: new Date().toISOString(),
};

describe('StudyGroupCard', () => {
  it('renders group info and triggers join/leave', () => {
    const onJoin = vi.fn();
    const onLeave = vi.fn();
    const onOpen = vi.fn();

    const { rerender } = render(
      <StudyGroupCard
        group={group}
        challenges={[]}
        isMember={false}
        onJoin={onJoin}
        onLeave={onLeave}
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByText('Join'));
    expect(onJoin).toHaveBeenCalled();

    rerender(
      <StudyGroupCard
        group={{ ...group, members: [...group.members, { id: 'u2', name: 'Bob' }] }}
        challenges={[]}
        isMember={true}
        onJoin={onJoin}
        onLeave={onLeave}
        onOpen={onOpen}
      />
    );

    fireEvent.click(screen.getByText('Leave'));
    expect(onLeave).toHaveBeenCalled();
  });
});
