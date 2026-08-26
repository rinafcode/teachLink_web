import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import * as videoEventsRepo from '@/lib/db/repositories/video-events.repository';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: () => ({
    addHeaders: (res: Response) => res,
    rateLimitResponse: null,
  }),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

vi.mock('@/lib/db/repositories/video-events.repository', () => ({
  create: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePost(body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request('https://example.com/api/video-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/video-analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when lessonId is missing', async () => {
    const res = await makePost({ eventType: 'play' });
    expect(res.status).toBe(400);
    expect(videoEventsRepo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when eventType is missing', async () => {
    const res = await makePost({ lessonId: 'lesson-1' });
    expect(res.status).toBe(400);
    expect(videoEventsRepo.create).not.toHaveBeenCalled();
  });

  it('calls videoEventsRepo.create with correct payload', async () => {
    const res = await makePost({
      lessonId: 'lesson-1',
      eventType: 'play',
      payload: { time: 120 },
    });
    
    expect(res.status).toBe(200);
    expect(videoEventsRepo.create).toHaveBeenCalledWith(undefined, 'lesson-1', 'play', { time: 120 });
  });

  it('handles database errors gracefully', async () => {
    vi.mocked(videoEventsRepo.create).mockRejectedValueOnce(new Error('DB Error'));
    
    const res = await makePost({
      lessonId: 'lesson-1',
      eventType: 'seek',
    });
    
    expect(res.status).toBe(500);
  });
});
