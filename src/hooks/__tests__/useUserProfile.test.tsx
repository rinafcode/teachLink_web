import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserProfile } from '../useUserProfile';

describe('useUserProfile Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses initialUser if provided without fetching', () => {
    const customUser = {
      initials: 'AS',
      name: 'Alice Smith',
      email: 'alice@example.com',
      bio: 'Developer & Instructor',
      learningGoal: 'monthly-course',
      dailyLearningTime: '1-hour',
      avatarUrl: '/avatars/alice.png',
    };

    const { result } = renderHook(() => useUserProfile(customUser));

    expect(result.current.user.name).toBe('Alice Smith');
    expect(result.current.user.email).toBe('alice@example.com');
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches profile data from API if no initialUser is provided', async () => {
    const mockProfile = {
      initials: 'JD',
      name: 'Jane Doe',
      email: 'jane@example.com',
      bio: 'Web3 developer',
      learningGoal: 'smart-contracts',
      dailyLearningTime: '30-minutes',
      avatarUrl: '/avatars/jane.png',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockProfile }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user.name).toBe('Jane Doe');
    expect(result.current.user.email).toBe('jane@example.com');
  });

  it('calls PUT API when updateProfile is invoked', async () => {
    const initialUser = {
      initials: 'JD',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Initial bio',
      learningGoal: 'monthly-course',
      dailyLearningTime: '30-minutes',
      avatarUrl: '/avatars/default.png',
    };

    const updatedUser = {
      ...initialUser,
      name: 'John Smith',
      bio: 'Updated bio',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: updatedUser }),
    });

    const { result } = renderHook(() => useUserProfile(initialUser));

    let success = false;
    await act(async () => {
      success = await result.current.updateProfile({ name: 'John Smith', bio: 'Updated bio' });
    });

    expect(success).toBe(true);
    expect(result.current.user.name).toBe('John Smith');
    expect(result.current.user.bio).toBe('Updated bio');
  });
});
