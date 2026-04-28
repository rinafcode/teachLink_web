import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/hooks/use-notification', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// ─── Imports after mocks ───────────────────────────────────────────────────────

import { apiClient } from '@/lib/api';
import LearningAssistant from '@/components/ai/LearningAssistant';
import PersonalizedRecommendations from '@/components/ai/PersonalizedRecommendations';
import IntelligentProgress from '@/components/ai/IntelligentProgress';
import SmartNotifications from '@/components/ai/SmartNotifications';
import NaturalLanguageQuery from '@/components/ai/NaturalLanguageQuery';

// ─── LearningAssistant ────────────────────────────────────────────────────────

describe('LearningAssistant', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockResolvedValue({ reply: 'Hello from AI!' });
  });

  it('renders input and send button', () => {
    render(<LearningAssistant />);
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('sends message and displays assistant response', async () => {
    const user = userEvent.setup();
    render(<LearningAssistant />);

    await user.type(screen.getByLabelText('Message input'), 'What is React?');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(screen.getByText('Hello from AI!')).toBeInTheDocument());
    expect(apiClient.post).toHaveBeenCalledWith('/api/ai/chat', {
      message: 'What is React?',
      context: undefined,
    });
  });

  it('shows typing indicator while loading', async () => {
    vi.mocked(apiClient.post).mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<LearningAssistant />);

    await user.type(screen.getByLabelText('Message input'), 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    expect(screen.getByLabelText('Assistant is typing')).toBeInTheDocument();
  });

  it('shows error message when API fails', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(<LearningAssistant />);

    await user.type(screen.getByLabelText('Message input'), 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() =>
      expect(screen.getByText('Sorry, something went wrong.')).toBeInTheDocument(),
    );
  });

  it('sends message on Enter key', async () => {
    const user = userEvent.setup();
    render(<LearningAssistant />);

    await user.type(screen.getByLabelText('Message input'), 'Hello{Enter}');

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    render(<LearningAssistant />);

    const input = screen.getByLabelText('Message input');
    await user.type(input, 'Hello');
    await user.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect((input as HTMLInputElement).value).toBe(''));
  });
});

// ─── PersonalizedRecommendations ─────────────────────────────────────────────

describe('PersonalizedRecommendations', () => {
  const mockItems = [
    { id: '1', title: 'Intro to TypeScript', reason: 'Based on your React progress', url: '/courses/ts' },
    { id: '2', title: 'Advanced CSS', reason: 'Matches your interests', url: '/courses/css' },
  ];

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ items: mockItems });
  });

  it('shows skeleton while loading', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<PersonalizedRecommendations />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders fetched recommendations', async () => {
    render(<PersonalizedRecommendations />);
    await waitFor(() => expect(screen.getByText('Intro to TypeScript')).toBeInTheDocument());
    expect(screen.getByText('Based on your React progress')).toBeInTheDocument();
    expect(screen.getByText('Advanced CSS')).toBeInTheDocument();
  });

  it('renders CTA links for each item', async () => {
    render(<PersonalizedRecommendations />);
    await waitFor(() => screen.getByText('Intro to TypeScript'));
    const links = screen.getAllByText('View course');
    expect(links).toHaveLength(2);
  });

  it('shows error state on failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'));
    render(<PersonalizedRecommendations />);
    await waitFor(() =>
      expect(screen.getByText('Failed to load recommendations.')).toBeInTheDocument(),
    );
  });

  it('shows empty state when no items', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ items: [] });
    render(<PersonalizedRecommendations />);
    await waitFor(() =>
      expect(screen.getByText('No recommendations yet.')).toBeInTheDocument(),
    );
  });
});

// ─── IntelligentProgress ─────────────────────────────────────────────────────

describe('IntelligentProgress', () => {
  const mockData = {
    courses: [
      { id: '1', title: 'React Fundamentals', percent: 80 },
      { id: '2', title: 'Node.js Basics', percent: 45 },
    ],
    insights: ["You're 80% through React Fundamentals", 'Strong in hooks, review context'],
  };

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue(mockData);
  });

  it('shows skeleton while loading', () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<IntelligentProgress />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders course progress bars', async () => {
    render(<IntelligentProgress />);
    await waitFor(() => expect(screen.getByText('React Fundamentals')).toBeInTheDocument());
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Node.js Basics')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('renders insights', async () => {
    render(<IntelligentProgress />);
    await waitFor(() =>
      expect(screen.getByText(/80% through React Fundamentals/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Strong in hooks/)).toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('fail'));
    render(<IntelligentProgress />);
    await waitFor(() =>
      expect(screen.getByText('Failed to load progress.')).toBeInTheDocument(),
    );
  });
});

// ─── SmartNotifications ───────────────────────────────────────────────────────

describe('SmartNotifications', () => {
  const mockReminders = [
    { id: 'r1', title: 'Review React hooks', scheduledAt: '2026-05-01T10:00:00Z' },
    { id: 'r2', title: 'Complete CSS quiz', scheduledAt: '2026-05-02T14:00:00Z' },
  ];

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ reminders: mockReminders });
    vi.mocked(apiClient.delete).mockResolvedValue({});
  });

  it('renders reminders after loading', async () => {
    render(<SmartNotifications />);
    await waitFor(() => expect(screen.getByText('Review React hooks')).toBeInTheDocument());
    expect(screen.getByText('Complete CSS quiz')).toBeInTheDocument();
  });

  it('dismisses a reminder on button click', async () => {
    const user = userEvent.setup();
    render(<SmartNotifications />);
    await waitFor(() => screen.getByText('Review React hooks'));

    await user.click(screen.getByLabelText('Dismiss Review React hooks'));

    await waitFor(() =>
      expect(screen.queryByText('Review React hooks')).not.toBeInTheDocument(),
    );
    expect(apiClient.delete).toHaveBeenCalledWith('/api/ai/reminders/r1');
  });

  it('shows empty state when no reminders', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ reminders: [] });
    render(<SmartNotifications />);
    await waitFor(() =>
      expect(screen.getByText('No upcoming reminders.')).toBeInTheDocument(),
    );
  });
});

// ─── NaturalLanguageQuery ─────────────────────────────────────────────────────

describe('NaturalLanguageQuery', () => {
  const mockResults = [
    { id: '1', title: 'Intro to ML', description: 'Machine learning basics', url: '/courses/ml' },
    { id: '2', title: 'Deep Learning', description: 'Neural networks', url: '/courses/dl' },
  ];

  beforeEach(() => {
    vi.mocked(apiClient.post).mockResolvedValue({ results: mockResults });
  });

  it('renders search input', () => {
    render(<NaturalLanguageQuery />);
    expect(screen.getByLabelText('Natural language search')).toBeInTheDocument();
  });

  it('submits query and renders results', async () => {
    const user = userEvent.setup();
    render(<NaturalLanguageQuery />);

    await user.type(screen.getByLabelText('Natural language search'), 'machine learning');
    await user.click(screen.getByLabelText('Search'));

    await waitFor(() => expect(screen.getByText('Intro to ML')).toBeInTheDocument());
    expect(screen.getByText('Deep Learning')).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith('/api/ai/search', { query: 'machine learning' });
  });

  it('shows empty state when no results', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ results: [] });
    const user = userEvent.setup();
    render(<NaturalLanguageQuery />);

    await user.type(screen.getByLabelText('Natural language search'), 'xyzzy');
    await user.click(screen.getByLabelText('Search'));

    await waitFor(() => expect(screen.getByText('No results found.')).toBeInTheDocument());
  });

  it('shows error state on failure', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<NaturalLanguageQuery />);

    await user.type(screen.getByLabelText('Natural language search'), 'test');
    await user.click(screen.getByLabelText('Search'));

    await waitFor(() =>
      expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument(),
    );
  });

  it('submits on Enter key', async () => {
    const user = userEvent.setup();
    render(<NaturalLanguageQuery />);

    await user.type(screen.getByLabelText('Natural language search'), 'react{Enter}');

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
  });
});
