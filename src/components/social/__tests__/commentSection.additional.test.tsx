// Additional tests for SocialInteractions component focusing on custom share URL and liked state
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialInteractions from '@/components/social/SocialInteractions';
import { apiClient } from '@/lib/api';
import { vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SocialInteractions – Additional edge cases', () => {
  const contentId = 'post-1';
  const customUrl = 'https://example.com/custom';

  beforeEach(() => {
    vi.mocked(apiClient.get).mockResolvedValue({ likes: 5, liked: true, comments: [] });
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.delete).mockResolvedValue({});
    // Reset clipboard mock
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders liked state with aria-label "Unlike"', async () => {
    render(<SocialInteractions contentId={contentId} />);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    const likeButton = screen.getByLabelText('Unlike');
    expect(likeButton).toBeInTheDocument();
  });

  it('copies the provided custom contentUrl when share is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<SocialInteractions contentId={contentId} contentUrl={customUrl} />);
    await waitFor(() => expect(screen.getByLabelText('Copy link')).toBeInTheDocument());
    await userEvent.setup().click(screen.getByLabelLabel('Copy link'));
    expect(writeText).toHaveBeenCalledWith(customUrl);
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });
});
