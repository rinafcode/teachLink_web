import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, analyticsStore } from '../route';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePost(body: Record<string, unknown>): Promise<Response> {
  return POST(new Request('https://example.com/api/video-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/video-analytics', () => {
  beforeEach(() => {
    analyticsStore.clear();
  });

  it('returns 400 when lessonId is missing', async () => {
    const res = await makePost({ eventType: 'play' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when eventType is missing', async () => {
    const res = await makePost({ lessonId: 'lesson-1' });
    expect(res.status).toBe(400);
  });

  it('stores events in order and caps at 1000', async () => {
    const lessonId = 'lesson-cap-test';
    const eventType = 'play';

    // Insert 1001 events
    for (let i = 1; i <= 1001; i++) {
      const res = await makePost({
        lessonId,
        eventType,
        payload: { seq: i },
      });
      expect(res.status).toBe(200);
    }

    const key = `anon::${encodeURIComponent(lessonId)}`;
    const stored = analyticsStore.get(key)!;

    expect(stored).toHaveLength(1000);

    // The first (oldest) stored event should be seq=2 (seq=1 was evicted)
    expect(stored[0].payload).toEqual({ seq: 2 });
    // The last (newest) stored event should be seq=1001
    expect(stored[stored.length - 1].payload).toEqual({ seq: 1001 });
  });

  it('keeps newest events and discards oldest when over capacity', async () => {
    const lessonId = 'lesson-discard-test';
    const eventType = 'seek';

    // Insert 1001 events with identifiable payloads
    for (let i = 0; i < 1001; i++) {
      await makePost({
        lessonId,
        eventType,
        payload: { index: i },
      });
    }

    const key = `anon::${encodeURIComponent(lessonId)}`;
    const stored = analyticsStore.get(key)!;

    // Event 0 (oldest) should be absent
    expect(stored.find((e) => e.payload?.index === 0)).toBeUndefined();
    // Event 1000 (newest) should be present
    expect(stored.find((e) => e.payload?.index === 1000)).toBeDefined();
    // Event 500 should still be present
    expect(stored.find((e) => e.payload?.index === 500)).toBeDefined();
  });
});
