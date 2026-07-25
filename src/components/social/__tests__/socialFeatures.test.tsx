import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), query: {} }),
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { apiClient } from '@/lib/api';
import { useFollowUser, useActivityFeed, useSocialInteractions } from '@/hooks/useSocialFeatures';
import SocialProfile from '@/components/social/SocialProfile';
import ActivityFeed from '@/components/social/ActivityFeed';
import SocialInteractions from '@/components/social/SocialInteractions';
import { formatFollowerCount, getRelativeTime, groupActivitiesByDate } from '@/utils/socialUtils';
import type { Activity } from '@/utils/socialUtils';

// ─── socialUtils ──────────────────────────────────────────────────────────────

describe('formatFollowerCount', () => {
  it('returns plain number for < 1000', () => expect(formatFollowerCount(999)).toBe('999'));
  it('formats thousands', () => expect(formatFollowerCount(1200)).toBe('1.2K'));
  it('formats exact thousands without decimal', () => expect(formatFollowerCount(2000)).toBe('2K'));
  it('formats millions', () => expect(formatFollowerCount(1_500_000)).toBe('1.5M'));
});

describe('getRelativeTime', () => {
  it('returns "just now" for < 60s', () => {
    expect(getRelativeTime(new Date(Date.now() - 30_000))).toBe('just now');
  });
  it('returns minutes ago', () => {
    expect(getRelativeTime(new Date(Date.now() - 2 * 60_000))).toBe('2 minutes ago');
  });
  it('returns hours ago', () => {
    expect(getRelativeTime(new Date(Date.now() - 3 * 3600_000))).toBe('3 hours ago');
  });
  it('returns singular correctly', () => {
    expect(getRelativeTime(new Date(Date.now() - 1 * 3600_000))).toBe('1 hour ago');
  });
});

describe('groupActivitiesByDate', () => {
  it('groups today activities under "Today"', () => {
    const activity: Activity = {
      id: '1',
      actorId: 'u1',
      actorName: 'Alice',
      action: 'liked',
      createdAt: new Date(),
    };
    const groups = groupActivitiesByDate([activity]);
    expect(groups['Today']).toHaveLength(1);
  });

  it('groups yesterday activities under "Yesterday"', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const activity: Activity = {
      id: '2',
      actorId: 'u1',
      actorName: 'Bob',
      action: 'commented',
      createdAt: d,
    };
    const groups = groupActivitiesByDate([activity]);
    expect(groups['Yesterday']).toHaveLength(1);
  });
});

// ─── useFollowUser ────────────────────────────────────────────────────────────

describe('useFollowUser', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ isFollowing: false });
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue({});
  });

  it('initializes isFollowing from API', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ isFollowing: true });
    const { result } = renderHook(() => useFollowUser('user-1'));
    await waitFor(() => expect(result.current.isFollowing).toBe(true));
  });

  it('follow() sets isFollowing to true', async () => {
    const { result } = renderHook(() => useFollowUser('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.follow());
    expect(result.current.isFollowing).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('/api/social/follow/user-1', {});
  });

  it('unfollow() sets isFollowing to false', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ isFollowing: true });
    const { result } = renderHook(() => useFollowUser('user-1'));
    await waitFor(() => expect(result.current.isFollowing).toBe(true));
    await act(() => result.current.unfollow());
    expect(result.current.isFollowing).toBe(false);
    expect(apiClient.delete).toHaveBeenCalledWith('/api/social/follow/user-1');
  });

  it('follow() sets loading true then false', async () => {
    let resolvePost!: (v: unknown) => void;
    vi.mocked(apiClient.post).mockReturnValue(new Promise((res) => (resolvePost = res)));

    const { result } = renderHook(() => useFollowUser('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.follow();
    });
    expect(result.current.loading).toBe(true);

    await act(async () => resolvePost({}));
    expect(result.current.loading).toBe(false);
  });

  it('unfollow() sets loading true then false', async () => {
    let resolveDelete!: (v: unknown) => void;
    vi.mocked(apiClient.delete).mockReturnValue(new Promise((res) => (resolveDelete = res)));

    vi.mocked(apiClient.get).mockResolvedValue({ isFollowing: true });
    const { result } = renderHook(() => useFollowUser('user-1'));
    await waitFor(() => expect(result.current.isFollowing).toBe(true));

    act(() => {
      result.current.unfollow();
    });
    expect(result.current.loading).toBe(true);

    await act(async () => resolveDelete({}));
    expect(result.current.loading).toBe(false);
  });

  it('follow() handles API error and resets loading', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useFollowUser('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.follow().catch(() => {}));
    expect(result.current.loading).toBe(false);
  });
});

// ─── useActivityFeed ─────────────────────────────────────────────────────────

describe('useActivityFeed', () => {
  const mockActivities: Activity[] = [
    { id: '1', actorId: 'u1', actorName: 'Alice', action: 'liked a post', createdAt: new Date() },
    { id: '2', actorId: 'u2', actorName: 'Bob', action: 'commented', createdAt: new Date() },
  ];

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockActivities, nextCursor: undefined });
  });

  it('loads activities on mount', async () => {
    const { result } = renderHook(() => useActivityFeed('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toHaveLength(2);
  });

  it('hasMore is false when no nextCursor', async () => {
    const { result } = renderHook(() => useActivityFeed('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it('hasMore is true when nextCursor present', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockActivities,
      nextCursor: 'cursor-abc',
    });
    const { result } = renderHook(() => useActivityFeed('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it('loadMore appends activities and uses cursor', async () => {
    const page1 = [mockActivities[0]];
    const page2 = [{ ...mockActivities[1], id: '3', action: 'shared' }];

    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: page1, nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ data: page2, nextCursor: undefined });

    const { result } = renderHook(() => useActivityFeed('user-1'));
    await waitFor(() => expect(result.current.activities).toHaveLength(1));

    await act(() => result.current.loadMore());
    expect(result.current.activities).toHaveLength(2);
    expect(result.current.activities[1].action).toBe('shared');
    expect(apiClient.get).toHaveBeenLastCalledWith(expect.stringContaining('cursor=cursor-1'));
  });

  it('handles API error in initial load gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useActivityFeed('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities).toHaveLength(0);
    expect(result.current.hasMore).toBe(false);
  });

  it('converts createdAt strings to Date objects', async () => {
    const raw = {
      id: '1',
      actorId: 'u1',
      actorName: 'Alice',
      action: 'liked',
      createdAt: '2024-06-15T12:00:00.000Z' as unknown as Date,
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: [raw], nextCursor: undefined });
    const { result } = renderHook(() => useActivityFeed('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.activities[0].createdAt).toBeInstanceOf(Date);
  });

  it('does not call loadMore while already loading', async () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useActivityFeed('user-1'));

    await act(() => result.current.loadMore());
    // Should not have made a second request while first is pending
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});

// ─── useSocialInteractions ────────────────────────────────────────────────────

describe('useSocialInteractions', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 5, liked: false, comments: [] });
    vi.mocked(apiClient.post).mockResolvedValue({
      id: 'c1',
      authorId: 'u1',
      authorName: 'Alice',
      body: 'Nice!',
      createdAt: new Date(),
    });
    vi.mocked(apiClient.delete).mockResolvedValue({});
  });

  it('loads initial likes and liked state', async () => {
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.likes).toBe(5));
    expect(result.current.liked).toBe(false);
  });

  it('toggleLike increments likes when not liked', async () => {
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.toggleLike());
    expect(result.current.likes).toBe(6);
    expect(result.current.liked).toBe(true);
  });

  it('toggleLike decrements likes when already liked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 5, liked: true, comments: [] });
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.liked).toBe(true));
    await act(() => result.current.toggleLike());
    expect(result.current.likes).toBe(4);
    expect(result.current.liked).toBe(false);
  });

  it('addComment appends to comments list', async () => {
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.addComment('Nice!'));
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0].body).toBe('Nice!');
  });

  it('toggleLike sends POST when not liked', async () => {
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.toggleLike());
    expect(apiClient.post).toHaveBeenCalledWith('/api/social/interactions/post-1/like', {});
  });

  it('toggleLike sends DELETE when liked', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 5, liked: true, comments: [] });
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.liked).toBe(true));
    await act(() => result.current.toggleLike());
    expect(apiClient.delete).toHaveBeenCalledWith('/api/social/interactions/post-1/like');
  });

  it('toggleLike sets loading true then false', async () => {
    let resolvePost!: (v: unknown) => void;
    vi.mocked(apiClient.post).mockReturnValue(new Promise((res) => (resolvePost = res)));

    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.toggleLike();
    });
    expect(result.current.loading).toBe(true);

    await act(async () => resolvePost({}));
    expect(result.current.loading).toBe(false);
  });

  it('toggleLike handles API error gracefully and resets loading', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.toggleLike().catch(() => {}));
    expect(result.current.loading).toBe(false);
  });

  it('addComment handles API error gracefully and resets loading', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.addComment('Will fail').catch(() => {}));
    expect(result.current.loading).toBe(false);
  });

  it('handles initial load API error gracefully', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.likes).toBe(0);
    expect(result.current.comments).toHaveLength(0);
  });
});

// ─── SocialProfile ────────────────────────────────────────────────────────────

describe('SocialProfile', () => {
  const user = {
    id: 'u1',
    name: 'Alice Smith',
    bio: 'Educator and developer',
    followerCount: 1200,
    followingCount: 340,
  };

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ isFollowing: false });
  });

  it('renders user name and bio', () => {
    render(<SocialProfile user={user} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Educator and developer')).toBeInTheDocument();
  });

  it('renders formatted follower/following counts', () => {
    render(<SocialProfile user={user} />);
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
  });

  it('renders Follow button for non-own profile', () => {
    render(<SocialProfile user={user} />);
    expect(screen.getByRole('button', { name: /follow/i })).toBeInTheDocument();
  });

  it('does not render Follow button for own profile', () => {
    render(<SocialProfile user={user} isOwnProfile />);
    expect(screen.queryByRole('button', { name: /follow/i })).not.toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<SocialProfile user={user} />);
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('switches tab content on click', async () => {
    const user_ = userEvent.setup();
    render(<SocialProfile user={user} />);
    await user_.click(screen.getByText('Activity'));
    expect(screen.getByText('Recent activity will appear here.')).toBeInTheDocument();
  });
});

// ─── ActivityFeed ─────────────────────────────────────────────────────────────

describe('ActivityFeed', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      actorId: 'u1',
      actorName: 'Alice',
      action: 'liked',
      targetTitle: 'Intro to React',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockActivities, nextCursor: undefined });
    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation((cb) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  it('renders activity items after loading', async () => {
    render(<ActivityFeed userId="u1" />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('liked')).toBeInTheDocument();
    expect(screen.getByText('Intro to React')).toBeInTheDocument();
  });

  it('shows skeleton while loading', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {})); // never resolves
    render(<ActivityFeed userId="u1" />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state when no activities', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [], nextCursor: undefined });
    render(<ActivityFeed userId="u1" />);
    await waitFor(() => expect(screen.getByText('No activity yet.')).toBeInTheDocument());
  });
});

// ─── SocialInteractions ───────────────────────────────────────────────────────

describe('SocialInteractions', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear().mockResolvedValue({
      likes: 10,
      liked: false,
      comments: [],
    });
    vi.mocked(apiClient.post).mockClear().mockResolvedValue({
      id: 'c1',
      authorId: 'u1',
      authorName: 'Alice',
      body: 'Great post!',
      createdAt: new Date(),
    });
    vi.mocked(apiClient.delete).mockClear().mockResolvedValue({});
    // jsdom doesn't implement clipboard; define it once with a spy
    const clipboardMock = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardMock,
      writable: true,
      configurable: true,
    });
  });

  it('renders like count', async () => {
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
  });

  it('toggleLike updates count on click', async () => {
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('10'));
    await user_.click(screen.getByLabelText('Like'));
    await waitFor(() => expect(screen.getByText('11')).toBeInTheDocument());
  });

  it('shows comment input when comments button clicked', async () => {
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user_.click(screen.getByLabelText('Toggle comments'));
    expect(screen.getByPlaceholderText('Add a comment…')).toBeInTheDocument();
  });

  it('copies link on share click and shows Copied! feedback', async () => {
    // Stub clipboard at the global level so the component can call it
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" contentUrl="https://teachlink.com/post/1" />);
    await user_.click(screen.getByLabelText('Copy link'));
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it('renders comment list when comments are present', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      likes: 10,
      liked: false,
      comments: [
        {
          id: 'c1',
          authorId: 'u1',
          authorName: 'Alice',
          body: 'This is a comment.',
          createdAt: new Date(),
        },
      ],
    });

    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user_.click(screen.getByLabelText('Toggle comments'));

    expect(await screen.findByText('This is a comment.')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('submits a new comment and displays it in the comment list', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      id: 'c2',
      authorId: 'u1',
      authorName: 'Alice',
      body: 'Nice post!',
      createdAt: new Date(),
    });

    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user_.click(screen.getByLabelText('Toggle comments'));

    const commentInput = screen.getByPlaceholderText('Add a comment…');
    const submitButton = screen.getByRole('button', { name: /post/i });

    await user_.type(commentInput, 'Nice post!');
    await user_.click(submitButton);

    await waitFor(() => expect(screen.getByText('Nice post!')).toBeInTheDocument());
    expect(apiClient.post).toHaveBeenCalledWith('/api/social/interactions/post-1/comments', {
      body: 'Nice post!',
    });
  });

  it('does not allow submitting whitespace-only comments', async () => {
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user_.click(screen.getByLabelText('Toggle comments'));

    const commentInput = screen.getByPlaceholderText('Add a comment…');
    const submitButton = screen.getByRole('button', { name: /post/i });

    await user_.type(commentInput, '   ');
    expect(submitButton).toBeDisabled();
    await user_.click(submitButton);
    expect(apiClient.post).not.toHaveBeenCalledWith(
      '/api/social/interactions/post-1/comments',
      expect.anything(),
    );
  });

  it('like button is disabled during loading', async () => {
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}));
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('10'));
    const likeBtn = screen.getByLabelText('Like');
    await user_.click(likeBtn);
    expect(likeBtn).toBeDisabled();
  });

  it('like button changes aria-label to Unlike after clicking', async () => {
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('10'));
    await user_.click(screen.getByLabelText('Like'));
    await waitFor(() => expect(screen.getByLabelText('Unlike')).toBeInTheDocument());
  });

  it('unlike changes aria-label back to Like', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 10, liked: true, comments: [] });
    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('10'));
    await user_.click(screen.getByLabelText('Unlike'));
    await waitFor(() => expect(screen.getByLabelText('Like')).toBeInTheDocument());
  });

  it('share button shows Copied! then reverts after timeout', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user_.click(screen.getByLabelText('Copy link'));
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('share without contentUrl copies window.location.href', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const originalHref = window.location.href;

    const user_ = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user_.click(screen.getByLabelText('Copy link'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(originalHref));

    vi.unstubAllGlobals();
  });

  it('handles initial load API failure without crashing', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => expect(screen.getByText('Share')).toBeInTheDocument());
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
