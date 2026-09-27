import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api';
import { getConferences } from '@/services/conferenceService';
import { createMeeting } from '@/services/videoConferenceService';

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('conference service resilience', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retries failed profile requests and applies a timeout', async () => {
    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ data: [] });

    await expect(getConferences('user-1')).resolves.toEqual([]);
    expect(apiClient.get).toHaveBeenCalledWith('/api/profile/user-1/conferences', {
      timeout: 10000,
    });
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('applies a timeout to meeting requests', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { id: 'meeting-1' } });

    await createMeeting({ roomId: 'room-1', hostId: 'user-1', title: 'Class' });

    expect(apiClient.post).toHaveBeenCalledWith('/api/conference/meetings', expect.anything(), {
      timeout: 10000,
    });
  });
});