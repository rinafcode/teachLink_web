/**
 * Tests for AI components
 *
 * Mocks:
 *  - @/lib/api  (apiClient)
 *  - @/context/ToastContext  (useToast)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
vi.mock('@/hooks/use-notification', () => ({
  useNotification: () => mockToast,
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { apiClient } from '@/lib/api';
import LearningAssistant from '@/components/ai/LearningAssistant';
import PersonalizedRecommendations from '@/components/ai/PersonalizedRecommendations';
import IntelligentProgress from '@/components/ai/IntelligentProgress';
import SmartNotifications from '@/components/ai/SmartNotifications';
import NaturalLanguageQuery from '@/components/ai/NaturalLanguageQuery';

const mockGet = apiClient.get as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as ReturnType<typeof vi.fn>;
const mockDelete = apiClient.delete as ReturnType<typeof vi.fn>;

// ─── LearningAssistant ────────────────────────────────────────────────────────

describe('LearningAssistant', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders input and send button', () => {
    render(<LearningAssistant />);
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('shows empty state prompt', () => {
    render(<LearningAssistant />);
    expect(screen.getByText(/ask me anything/i)).toBeInTheDocument();
  });

  it('sends message and displays assistant reply', async () => {
    mockPost.mockResolvedValueOnce({ data: { reply: 'Hello from AI!' }, success: true });

    render(<LearningAssistant />);
    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Hi there' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    // User message appears immediately
    expect(screen.getByText('Hi there')).toBeInTheDocument();

    // Typing indicator while loading
    expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Hello from AI!')).toBeInTheDocument());
    expect(mockPost).toHaveBeenCalledWith('/api/ai/chat', { message: 'Hi there', context: 'learning' });
  });

  it('shows error message on API failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    render(<LearningAssistant />);
    fireEvent.change(screen.getByLabelText('Message input'), { target: { value: 'test' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to get a response/i),
    );
  });

  it('send button is disabled when input is empty', () => {
    render(<LearningAssistant />);
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });

  it('submits on Enter key', async () => {
    mockPost.mockResolvedValueOnce({ data: { reply: 'Got it' }, success: true });

    render(<LearningAssistant />);
    const input = screen.getByLabelText('Message input');
    fireEvent.change(input, { target: { value: 'Enter test' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));
  });
});

// ─── PersonalizedRecommendations ─────────────────────────────────────────────

describe('PersonalizedRecommendations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValueOnce(new Promise(() => {})); // never resolves
    render(<PersonalizedRecommendations />);
    expect(screen.getByLabelText('Loading recommendations')).toBeInTheDocument();
  });

  it('renders fetched recommendations', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: [
        { id: '1', title: 'React Basics', reason: 'Matches your goals', url: '/courses/1' },
        { id: '2', title: 'TypeScript Deep Dive', reason: 'Popular in your area', url: '/courses/2' },
      ],
    });

    render(<PersonalizedRecommendations />);

    await waitFor(() => expect(screen.getByText('React Basics')).toBeInTheDocument());
    expect(screen.getByText('Matches your goals')).toBeInTheDocument();
    expect(screen.getByText('TypeScript Deep Dive')).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail'));
    render(<PersonalizedRecommendations />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load recommendations/i),
    );
  });

  it('shows empty state when no recommendations', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: [] });
    render(<PersonalizedRecommendations />);
    await waitFor(() =>
      expect(screen.getByText(/no recommendations yet/i)).toBeInTheDocument(),
    );
  });
});

// ─── IntelligentProgress ─────────────────────────────────────────────────────

describe('IntelligentProgress', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValueOnce(new Promise(() => {}));
    render(<IntelligentProgress />);
    // Skeletons render; no progress bar yet
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders progress bar and insights', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: {
        streak: 10,
        totalTimeSpent: 200,
        dailyGoal: 30,
        lastActive: new Date().toISOString(),
        completedCourses: 4,
        totalCourses: 8,
      },
    });

    render(<IntelligentProgress />);

    await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument());
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getAllByText(/50%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/10-day streak/i)).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail'));
    render(<IntelligentProgress />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load progress/i),
    );
  });
});

// ─── SmartNotifications ───────────────────────────────────────────────────────

describe('SmartNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows skeleton while loading', () => {
    mockGet.mockReturnValueOnce(new Promise(() => {}));
    render(<SmartNotifications />);
    expect(screen.getByLabelText('Loading reminders')).toBeInTheDocument();
  });

  it('renders reminders', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'r1', title: 'Study React', scheduledAt: '2026-04-29T10:00:00Z' },
        { id: 'r2', title: 'Review TypeScript', scheduledAt: '2026-04-30T09:00:00Z' },
      ],
    });

    render(<SmartNotifications />);

    await waitFor(() => expect(screen.getByText('Study React')).toBeInTheDocument());
    expect(screen.getByText('Review TypeScript')).toBeInTheDocument();
  });

  it('dismisses a reminder and shows success toast', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'r1', title: 'Study React', scheduledAt: '2026-04-29T10:00:00Z' }],
    });
    mockDelete.mockResolvedValueOnce({ success: true, data: null });

    render(<SmartNotifications />);

    await waitFor(() => expect(screen.getByText('Study React')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Dismiss reminder: Study React'));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('/api/ai/reminders/r1'));
    expect(mockToast.success).toHaveBeenCalledWith('Reminder dismissed.');
    expect(screen.queryByText('Study React')).not.toBeInTheDocument();
  });

  it('shows error toast when dismiss fails', async () => {
    mockGet.mockResolvedValueOnce({
      success: true,
      data: [{ id: 'r1', title: 'Study React', scheduledAt: '2026-04-29T10:00:00Z' }],
    });
    mockDelete.mockRejectedValueOnce(new Error('fail'));

    render(<SmartNotifications />);

    await waitFor(() => expect(screen.getByText('Study React')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Dismiss reminder: Study React'));

    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Failed to dismiss reminder.'));
  });

  it('shows error state when fetch fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail'));
    render(<SmartNotifications />);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load reminders/i),
    );
  });

  it('shows empty state when no reminders', async () => {
    mockGet.mockResolvedValueOnce({ success: true, data: [] });
    render(<SmartNotifications />);
    await waitFor(() =>
      expect(screen.getByText(/no upcoming reminders/i)).toBeInTheDocument(),
    );
  });
});

// ─── NaturalLanguageQuery ─────────────────────────────────────────────────────

describe('NaturalLanguageQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders search input and button', () => {
    render(<NaturalLanguageQuery />);
    expect(screen.getByLabelText('Search query')).toBeInTheDocument();
    expect(screen.getByLabelText('Submit search')).toBeInTheDocument();
  });

  it('submits query and renders results', async () => {
    mockPost.mockResolvedValueOnce({
      success: true,
      data: [
        { id: 's1', title: 'Python for Beginners', description: 'Start here', url: '/courses/py' },
      ],
    });

    render(<NaturalLanguageQuery />);
    fireEvent.change(screen.getByLabelText('Search query'), {
      target: { value: 'python basics' },
    });
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => expect(screen.getByText('Python for Beginners')).toBeInTheDocument());
    expect(screen.getByText('Start here')).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith('/api/ai/search', { query: 'python basics' });
  });

  it('shows "No results found" for empty results', async () => {
    mockPost.mockResolvedValueOnce({ success: true, data: [] });

    render(<NaturalLanguageQuery />);
    fireEvent.change(screen.getByLabelText('Search query'), { target: { value: 'xyz' } });
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() => expect(screen.getByText(/no results found/i)).toBeInTheDocument());
  });

  it('shows error state on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('fail'));

    render(<NaturalLanguageQuery />);
    fireEvent.change(screen.getByLabelText('Search query'), { target: { value: 'test' } });
    fireEvent.submit(screen.getByRole('search'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/search failed/i),
    );
  });

  it('submit button is disabled when query is empty', () => {
    render(<NaturalLanguageQuery />);
    expect(screen.getByLabelText('Submit search')).toBeDisabled();
  });

  it('shows loading state while searching', async () => {
    mockPost.mockReturnValueOnce(new Promise(() => {}));

    render(<NaturalLanguageQuery />);
    fireEvent.change(screen.getByLabelText('Search query'), { target: { value: 'react' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });
});
