import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useStudyGroups } from '@/app/hooks/useStudyGroups';

// Ensure localStorage is clean before each test
beforeEach(() => {
  localStorage.clear();
});

describe('useStudyGroups', () => {
  it('creates a group and allows joining', () => {
    const { result } = renderHook(() => useStudyGroups({ id: 'u1', name: 'Alice' }));

    let groupId = '';
    act(() => {
      const g = result.current.createGroup({ name: 'Math Club', description: 'Algebra focus' });
      groupId = g.id;
    });

    expect(result.current.groups.length).toBe(1);
    expect(result.current.groups[0].name).toBe('Math Club');

    // Another user joins
    const { result: bob } = renderHook(() => useStudyGroups({ id: 'u2', name: 'Bob' }));
    act(() => {
      bob.current.joinGroup(groupId);
    });

    const group = bob.current.groups.find((g) => g.id === groupId)!;
    expect(group.members.map((m) => m.id)).toContain('u2');
  });

  it('posts messages and builds leaderboard from challenges', () => {
    const { result } = renderHook(() => useStudyGroups({ id: 'u1', name: 'Alice' }));

    let groupId = '';
    act(() => {
      groupId = result.current.createGroup({ name: 'Science', description: '' }).id;
    });

    act(() => {
      result.current.postMessage(groupId, '<p>Hello team</p>');
    });
    expect(result.current.groupMessages(groupId).length).toBe(1);

    // Create a challenge
    let challengeId = '';
    act(() => {
      challengeId = result.current.createChallenge(groupId, {
        title: 'Weekly Study',
        description: '',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        target: 100,
      }).id;
    });

    // Update progress for two users
    act(() => {
      result.current.updateChallengeProgress(challengeId, 40);
    });

    const { result: bob } = renderHook(() => useStudyGroups({ id: 'u2', name: 'Bob' }));
    act(() => {
      bob.current.updateChallengeProgress(challengeId, 70);
    });

    const lb = result.current.challengeLeaderboard(challengeId);
    expect(lb[0].userName).toBe('Bob');
    expect(lb[0].progress).toBe(70);
  });

  it('adds resources (link and file)', () => {
    const { result } = renderHook(() => useStudyGroups({ id: 'u1', name: 'Alice' }));
    let groupId = '';
    act(() => { groupId = result.current.createGroup({ name: 'History' }).id; });

    act(() => {
      result.current.addResource(groupId, { title: 'Great article', type: 'link', url: 'https://example.com' });
    });
    expect(result.current.groupResources(groupId).length).toBe(1);
    expect(result.current.groupResources(groupId)[0].type).toBe('link');
  });
});
