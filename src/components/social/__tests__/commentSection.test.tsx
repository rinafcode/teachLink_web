import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
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

vi.mock('next/image', () => ({
  // Simplified Image stub so jsdom can render it without errors
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { apiClient } from '@/lib/api';
import { useSocialInteractions } from '@/hooks/useSocialFeatures';
import { useTopicFeed } from '@/hooks/useTopicFeed';
import SocialInteractions from '@/components/social/SocialInteractions';
import FollowingSystem from '@/components/social/FollowingSystem';
import TopicFeed from '@/components/social/TopicFeed';
import { getRelativeTime, formatFollowerCount, groupActivitiesByDate } from '@/utils/socialUtils';
import type { Activity, Topic, TopicPost } from '@/utils/socialUtils';
import type { Comment } from '@/hooks/useSocialFeatures';

// ─── Shared test data ──────────────────────────────────────────────────────────

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 'c1',
  authorId: 'u1',
  authorName: 'Alice',
  body: 'Great post!',
  createdAt: new Date(Date.now() - 60_000), // 1 minute ago
  ...overrides,
});

const makeTopic = (overrides: Partial<Topic> = {}): Topic => ({
  slug: 'react',
  name: 'React',
  description: 'All things React',
  postCount: 42,
  followerCount: 1200,
  ...overrides,
});

const makeTopicPost = (overrides: Partial<TopicPost> = {}): TopicPost => ({
  id: 'p1',
  authorId: 'u1',
  authorName: 'Alice',
  title: 'Understanding hooks',
  body: 'Hooks are great because…',
  topicSlug: 'react',
  likes: 10,
  commentCount: 3,
  createdAt: new Date(Date.now() - 3_600_000), // 1 hour ago
  ...overrides,
});

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Stub navigator.clipboard so share tests don't crash in jsdom. */
function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    writable: true,
    configurable: true,
  });
  return writeText;
}

/** Stub IntersectionObserver (required by TopicFeed / ActivityFeed). */
function stubIntersectionObserver() {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// socialUtils – extended coverage
// ═══════════════════════════════════════════════════════════════════════════════

describe('getRelativeTime – extended ranges', () => {
  it('returns days ago', () => {
    expect(getRelativeTime(new Date(Date.now() - 2 * 86_400_000))).toBe('2 days ago');
  });

  it('returns singular day', () => {
    expect(getRelativeTime(new Date(Date.now() - 1 * 86_400_000))).toBe('1 day ago');
  });

  it('returns weeks ago', () => {
    expect(getRelativeTime(new Date(Date.now() - 14 * 86_400_000))).toBe('2 weeks ago');
  });

  it('returns singular week', () => {
    expect(getRelativeTime(new Date(Date.now() - 7 * 86_400_000))).toBe('1 week ago');
  });

  it('returns months ago', () => {
    expect(getRelativeTime(new Date(Date.now() - 60 * 86_400_000))).toBe('2 months ago');
  });

  it('returns years ago', () => {
    expect(getRelativeTime(new Date(Date.now() - 400 * 86_400_000))).toBe('1 year ago');
  });
});

describe('formatFollowerCount – edge cases', () => {
  it('handles 0', () => expect(formatFollowerCount(0)).toBe('0'));
  it('handles exactly 1000', () => expect(formatFollowerCount(1000)).toBe('1K'));
  it('handles exactly 1_000_000', () => expect(formatFollowerCount(1_000_000)).toBe('1M'));
  it('handles large millions', () => expect(formatFollowerCount(2_500_000)).toBe('2.5M'));
});

describe('groupActivitiesByDate – multi-day grouping', () => {
  it('places activities from different days into separate groups', () => {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const activities: Activity[] = [
      { id: '1', actorId: 'u1', actorName: 'Alice', action: 'liked', createdAt: today },
      { id: '2', actorId: 'u2', actorName: 'Bob', action: 'commented', createdAt: twoDaysAgo },
    ];

    const groups = groupActivitiesByDate(activities);
    expect(groups['Today']).toHaveLength(1);
    expect(groups['Today'][0].id).toBe('1');
    // The second group key is a formatted date, not 'Yesterday'
    const keys = Object.keys(groups);
    expect(keys).toHaveLength(2);
  });

  it('returns an empty object for an empty array', () => {
    expect(groupActivitiesByDate([])).toEqual({});
  });

  it('preserves insertion order within a group', () => {
    const now = new Date();
    const a1: Activity = {
      id: 'a',
      actorId: 'u1',
      actorName: 'Alice',
      action: 'liked',
      createdAt: now,
    };
    const a2: Activity = {
      id: 'b',
      actorId: 'u1',
      actorName: 'Alice',
      action: 'commented',
      createdAt: now,
    };
    const groups = groupActivitiesByDate([a1, a2]);
    expect(groups['Today'][0].id).toBe('a');
    expect(groups['Today'][1].id).toBe('b');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useSocialInteractions – Comment Section hook
// ═══════════════════════════════════════════════════════════════════════════════

describe('useSocialInteractions – comment section', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [] });
    vi.mocked(apiClient.post).mockResolvedValue(makeComment());
    vi.mocked(apiClient.delete).mockResolvedValue({});
  });

  afterEach(() => vi.clearAllMocks());

  it('starts with an empty comment list', async () => {
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments).toHaveLength(0);
  });

  it('loads pre-existing comments from the API', async () => {
    const existing = makeComment({ id: 'existing', body: 'Hello!' });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 2, liked: false, comments: [existing] });
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.comments).toHaveLength(1));
    expect(result.current.comments[0].body).toBe('Hello!');
  });

  it('addComment posts to the correct API endpoint', async () => {
    const { result } = renderHook(() => useSocialInteractions('post-42'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.addComment('Nice!'));
    expect(apiClient.post).toHaveBeenCalledWith('/api/social/interactions/post-42/comments', {
      body: 'Nice!',
    });
  });

  it('addComment appends comment to the end of the list', async () => {
    const first = makeComment({ id: 'c1', body: 'First!' });
    const second = makeComment({ id: 'c2', body: 'Second!' });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [first] });
    vi.mocked(apiClient.post).mockResolvedValue(second);

    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.comments).toHaveLength(1));
    await act(() => result.current.addComment('Second!'));
    expect(result.current.comments).toHaveLength(2);
    expect(result.current.comments[1].body).toBe('Second!');
  });

  it('sets loading true during addComment and false after', async () => {
    let resolvePost!: (v: unknown) => void;
    vi.mocked(apiClient.post).mockReturnValue(new Promise((res) => (resolvePost = res)));

    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addComment('Async…');
    });
    expect(result.current.loading).toBe(true);

    await act(async () => resolvePost(makeComment({ body: 'Async…' })));
    expect(result.current.loading).toBe(false);
  });

  it('handles addComment API failure gracefully (loading resets)', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.addComment('Will fail').catch(() => {}));
    expect(result.current.loading).toBe(false);
  });

  it('converts createdAt strings to Date objects for loaded comments', async () => {
    const rawComment = {
      id: 'c1',
      authorId: 'u1',
      authorName: 'Alice',
      body: 'Hi',
      createdAt: '2024-01-15T10:00:00.000Z',
    };
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [rawComment] });
    const { result } = renderHook(() => useSocialInteractions('post-1'));
    await waitFor(() => expect(result.current.comments).toHaveLength(1));
    expect(result.current.comments[0].createdAt).toBeInstanceOf(Date);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SocialInteractions – Comment Section UI
// ═══════════════════════════════════════════════════════════════════════════════

describe('SocialInteractions – Comment Section UI', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 5, liked: false, comments: [] });
    vi.mocked(apiClient.post).mockResolvedValue(makeComment());
    vi.mocked(apiClient.delete).mockResolvedValue({});
    stubClipboard();
  });

  afterEach(() => vi.clearAllMocks());

  // ── Visibility toggle ───────────────────────────────────────────────────────

  it('hides the comment section by default', () => {
    render(<SocialInteractions contentId="post-1" />);
    expect(screen.queryByPlaceholderText('Add a comment…')).not.toBeInTheDocument();
  });

  it('shows the comment section after clicking the Toggle comments button', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));
    expect(screen.getByPlaceholderText('Add a comment…')).toBeInTheDocument();
  });

  it('hides the comment section when toggled a second time', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));
    await user.click(screen.getByLabelText('Toggle comments'));
    expect(screen.queryByPlaceholderText('Add a comment…')).not.toBeInTheDocument();
  });

  // ── Empty state ─────────────────────────────────────────────────────────────

  it('shows "No comments yet." when the comment list is empty', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('5')); // wait for initial load
    await user.click(screen.getByLabelText('Toggle comments'));
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
  });

  // ── Comment count badge ─────────────────────────────────────────────────────

  it('displays the correct comment count on the toggle button', async () => {
    const comments = [makeComment({ id: 'c1' }), makeComment({ id: 'c2' })];
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments });
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  // ── Comment list rendering ──────────────────────────────────────────────────

  it('renders a comment with author name and body', async () => {
    const comment = makeComment({ authorName: 'Bob', body: 'Fantastic article!' });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [comment] });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    await user.click(screen.getByLabelText('Toggle comments'));

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Fantastic article!')).toBeInTheDocument();
  });

  it('renders the relative timestamp for each comment', async () => {
    const comment = makeComment({ createdAt: new Date(Date.now() - 120_000) }); // 2 min ago
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [comment] });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('1'));
    await user.click(screen.getByLabelText('Toggle comments'));

    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
  });

  it('renders a fallback avatar icon when authorAvatar is absent', async () => {
    const comment = makeComment({ authorAvatar: undefined });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [comment] });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('1'));
    await user.click(screen.getByLabelText('Toggle comments'));

    // Lucide UserCircle renders an SVG – assert no <img> tag for avatar
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders an <img> tag when authorAvatar is provided', async () => {
    const comment = makeComment({ authorAvatar: 'https://example.com/avatar.png' });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [comment] });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('1'));
    await user.click(screen.getByLabelText('Toggle comments'));

    const img = screen.getByRole('img', { name: comment.authorName });
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('renders multiple comments in the correct order', async () => {
    const comments = [
      makeComment({ id: 'c1', body: 'First comment' }),
      makeComment({ id: 'c2', body: 'Second comment' }),
      makeComment({ id: 'c3', body: 'Third comment' }),
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('3'));
    await user.click(screen.getByLabelText('Toggle comments'));

    const allCommentBodies = screen.getAllByText(/comment$/i).map((el) => el.textContent);
    expect(allCommentBodies).toEqual(['First comment', 'Second comment', 'Third comment']);
  });

  // ── Comment form – input validation ────────────────────────────────────────

  it('disables the Post button when the draft input is empty', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));
    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
  });

  it('enables the Post button when the draft input has text', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));
    await user.type(screen.getByPlaceholderText('Add a comment…'), 'Hello');
    expect(screen.getByRole('button', { name: /post/i })).not.toBeDisabled();
  });

  it('keeps Post button disabled for whitespace-only input', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));
    await user.type(screen.getByPlaceholderText('Add a comment…'), '   ');
    expect(screen.getByRole('button', { name: /post/i })).toBeDisabled();
  });

  // ── Comment submission ──────────────────────────────────────────────────────

  it('submitting the form calls addComment with trimmed text', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));

    const input = screen.getByPlaceholderText('Add a comment…');
    await user.type(input, '  Nice work!  ');
    await user.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/api/social/interactions/post-1/comments', {
        body: 'Nice work!',
      }),
    );
  });

  it('clears the draft input after a successful submission', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));

    const input = screen.getByPlaceholderText('Add a comment…') as HTMLInputElement;
    await user.type(input, 'My comment');
    await user.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() => expect(input.value).toBe(''));
  });

  it('appends the new comment to the visible list after submission', async () => {
    const newComment = makeComment({ id: 'new', body: 'Brand new comment' });
    vi.mocked(apiClient.post).mockResolvedValue(newComment);

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));

    await user.type(screen.getByPlaceholderText('Add a comment…'), 'Brand new comment');
    await user.click(screen.getByRole('button', { name: /post/i }));

    await waitFor(() => expect(screen.getByText('Brand new comment')).toBeInTheDocument());
  });

  it('does not submit when the form is submitted with an empty draft', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));

    // Press Enter in an empty input
    const input = screen.getByPlaceholderText('Add a comment…');
    await user.type(input, '{enter}');

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  // ── Accessibility ────────────────────────────────────────────────────────────

  it('comment input has a placeholder that serves as a visible label cue', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.click(screen.getByLabelText('Toggle comments'));
    expect(screen.getByPlaceholderText('Add a comment…')).toBeInTheDocument();
  });

  it('Toggle comments button is keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await user.tab();
    // The first focusable button is the Like button; tab again to reach comments
    await user.tab();
    expect(screen.getByLabelText('Toggle comments')).toHaveFocus();
  });

  // ── Security: XSS prevention ────────────────────────────────────────────────

  it('renders comment body as text, not raw HTML (XSS prevention)', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    const comment = makeComment({ body: xssPayload });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [comment] });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('1'));
    await user.click(screen.getByLabelText('Toggle comments'));

    // The payload must appear as text content, not executed HTML
    expect(screen.getByText(xssPayload)).toBeInTheDocument();
    // No <script> element should have been injected into the DOM
    expect(document.querySelector('script[data-injected]')).not.toBeInTheDocument();
  });

  it('renders comment author name as text, not raw HTML', async () => {
    const xssName = '<img src=x onerror=alert(1)>';
    const comment = makeComment({ authorName: xssName });
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 0, liked: false, comments: [comment] });

    const user = userEvent.setup();
    render(<SocialInteractions contentId="post-1" />);
    await waitFor(() => screen.getByText('1'));
    await user.click(screen.getByLabelText('Toggle comments'));

    expect(screen.getByText(xssName)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FollowingSystem
// ═══════════════════════════════════════════════════════════════════════════════

describe('FollowingSystem', () => {
  const mockUsers = [
    { id: 'u1', name: 'Alice', bio: 'Teacher', followerCount: 100, followingCount: 50 },
    { id: 'u2', name: 'Bob', followerCount: 200, followingCount: 30 },
  ];

  beforeEach(() => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/followers/')) return mockUsers;
      if (url.includes('/following/')) return mockUsers;
      if (url.includes('/follow/')) return { isFollowing: false };
      return [];
    });
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue({});
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the Followers and Following tabs', async () => {
    render(<FollowingSystem userId="me" />);
    expect(screen.getByText('followers')).toBeInTheDocument();
    expect(screen.getByText('following')).toBeInTheDocument();
  });

  it('loads and renders user names from the followers list', async () => {
    render(<FollowingSystem userId="me" />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders the user bio when present', async () => {
    render(<FollowingSystem userId="me" />);
    await waitFor(() => expect(screen.getByText('Teacher')).toBeInTheDocument());
  });

  it('renders a Follow button for each user initially not followed', async () => {
    render(<FollowingSystem userId="me" />);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /follow/i }).length).toBeGreaterThan(0),
    );
  });

  it('switches to the Following tab and reloads the list', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/followers/')) return mockUsers;
      if (url.includes('/following/'))
        return [{ id: 'u3', name: 'Carol', followerCount: 50, followingCount: 10 }];
      if (url.includes('/follow/')) return { isFollowing: false };
      return [];
    });

    render(<FollowingSystem userId="me" />);
    await waitFor(() => screen.getByText('Alice'));

    await user.click(screen.getByText('following'));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/social/following/me'));
  });

  it('shows "No users found." when the list is empty', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/followers/')) return [];
      if (url.includes('/follow/')) return { isFollowing: false };
      return [];
    });
    render(<FollowingSystem userId="me" />);
    await waitFor(() => expect(screen.getByText('No users found.')).toBeInTheDocument());
  });

  it('filters users as the search query is typed', async () => {
    const user = userEvent.setup();
    render(<FollowingSystem userId="me" />);
    await waitFor(() => screen.getByText('Alice'));

    await user.type(screen.getByPlaceholderText('Search…'), 'ali');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<FollowingSystem userId="me" />);
    await waitFor(() => screen.getByText('Bob'));

    await user.type(screen.getByPlaceholderText('Search…'), 'BOB');
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('shows "No users found." when search query matches no users', async () => {
    const user = userEvent.setup();
    render(<FollowingSystem userId="me" />);
    await waitFor(() => screen.getByText('Alice'));

    await user.type(screen.getByPlaceholderText('Search…'), 'zzz');
    expect(screen.getByText('No users found.')).toBeInTheDocument();
  });

  it('fetches the followers list from the correct API endpoint', async () => {
    render(<FollowingSystem userId="user-99" />);
    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith('/api/social/followers/user-99'),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useTopicFeed
// ═══════════════════════════════════════════════════════════════════════════════

describe('useTopicFeed', () => {
  const topic = makeTopic();
  const posts = [makeTopicPost({ id: 'p1' }), makeTopicPost({ id: 'p2' })];

  beforeEach(() => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/posts')) return { data: posts, nextCursor: undefined };
      return topic;
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('loads topic and posts on mount', async () => {
    const { result } = renderHook(() => useTopicFeed('react'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.topic?.name).toBe('React');
    expect(result.current.posts).toHaveLength(2);
  });

  it('sets hasMore false when no nextCursor', async () => {
    const { result } = renderHook(() => useTopicFeed('react'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(false);
  });

  it('sets hasMore true when nextCursor is present', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/posts')) return { data: posts, nextCursor: 'cursor-abc' };
      return topic;
    });

    const { result } = renderHook(() => useTopicFeed('react'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasMore).toBe(true);
  });

  it('starts with sort = "latest"', async () => {
    const { result } = renderHook(() => useTopicFeed('react'));
    expect(result.current.sort).toBe('latest');
  });

  it('setSort changes the sort option', async () => {
    const { result } = renderHook(() => useTopicFeed('react'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setSort('popular'));
    expect(result.current.sort).toBe('popular');
  });

  it('sets error message when the API call fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useTopicFeed('broken'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to load topic feed. Please try again.');
  });

  it('converts post createdAt to Date objects', async () => {
    const rawPost = { ...makeTopicPost(), createdAt: '2024-03-01T00:00:00Z' as unknown as Date };
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/posts')) return { data: [rawPost], nextCursor: undefined };
      return topic;
    });

    const { result } = renderHook(() => useTopicFeed('react'));
    await waitFor(() => expect(result.current.posts).toHaveLength(1));
    expect(result.current.posts[0].createdAt).toBeInstanceOf(Date);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TopicFeed – component
// ═══════════════════════════════════════════════════════════════════════════════

describe('TopicFeed', () => {
  const topic = makeTopic({ name: 'React', postCount: 42, followerCount: 1200 });
  const posts = [
    makeTopicPost({ id: 'p1', title: 'Understanding hooks', authorName: 'Alice' }),
    makeTopicPost({ id: 'p2', title: 'State management tips', authorName: 'Bob' }),
  ];

  beforeEach(() => {
    stubIntersectionObserver();
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/posts')) return { data: posts, nextCursor: undefined };
      return topic;
    });
  });

  afterEach(() => vi.clearAllMocks());

  it('renders the topic name as a heading', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('#React'),
    );
  });

  it('renders the topic description', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => expect(screen.getByText('All things React')).toBeInTheDocument());
  });

  it('renders formatted post count and follower count', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(screen.getByText('1.2K')).toBeInTheDocument();
  });

  it('renders post titles after loading', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => expect(screen.getByText('Understanding hooks')).toBeInTheDocument());
    expect(screen.getByText('State management tips')).toBeInTheDocument();
  });

  it('renders post author names', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows skeletons while loading', () => {
    // Never-resolving promise simulates a long load
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<TopicFeed slug="react" />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows the empty state when there are no posts', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/posts')) return { data: [], nextCursor: undefined };
      return topic;
    });

    render(<TopicFeed slug="react" />);
    await waitFor(() =>
      expect(
        screen.getByText('No posts in this topic yet. Be the first to share!'),
      ).toBeInTheDocument(),
    );
  });

  it('shows an error alert when the API fails', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('timeout'));
    render(<TopicFeed slug="broken" />);
    await waitFor(() =>
      expect(screen.getByText('Failed to load topic feed. Please try again.')).toBeInTheDocument(),
    );
  });

  it('renders the sort control with Latest, Popular, Oldest options', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => screen.getByText('Understanding hooks'));
    expect(screen.getByRole('button', { name: /latest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /popular/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /oldest/i })).toBeInTheDocument();
  });

  it('changing the sort option triggers a fresh API load', async () => {
    const user = userEvent.setup();
    render(<TopicFeed slug="react" />);
    await waitFor(() => screen.getByText('Understanding hooks'));

    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/posts')) return { data: [], nextCursor: undefined };
      return topic;
    });

    await user.click(screen.getByRole('button', { name: /popular/i }));

    await waitFor(() =>
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('sort=popular')),
    );
  });

  it('Latest sort button has aria-pressed true by default', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => screen.getByText('Understanding hooks'));
    expect(screen.getByRole('button', { name: /latest/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows "You\'ve reached the end" when all posts are loaded', async () => {
    render(<TopicFeed slug="react" />);
    await waitFor(() => expect(screen.getByText("You've reached the end")).toBeInTheDocument());
  });
});
