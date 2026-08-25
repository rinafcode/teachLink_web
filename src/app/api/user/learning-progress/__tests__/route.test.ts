import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { withRateLimit } from '@/lib/ratelimit';

vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

describe('/api/user/learning-progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns learning progress for in-progress courses', async () => {
    const request = new Request('http://localhost/api/user/learning-progress');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);

    const item = json.data[0];
    expect(item).toHaveProperty('courseId');
    expect(item).toHaveProperty('title');
    expect(item.progress).toBeGreaterThan(0);
    expect(item.progress).toBeLessThanOrEqual(100);
    expect(item.timeRemaining).toBeDefined();
    expect(item.totalLessons).toBeGreaterThanOrEqual(0);
    expect(item.category).toBeDefined();
  });

  it('excludes courses with zero progress', async () => {
    const request = new Request('http://localhost/api/user/learning-progress');
    const response = await GET(request);
    const json = await response.json();

    expect(json.data.length).toBeGreaterThan(0);
    for (const item of json.data) {
      expect(item.progress).toBeGreaterThan(0);
    }
  });

  it('returns rate limited response when limit exceeded', async () => {
    const rateLimitResponse = new Response('rate limited', { status: 429 });
    vi.mocked(withRateLimit).mockReturnValueOnce({
      addHeaders: (response: Response) => response,
      rateLimitResponse,
    });

    const request = new Request('http://localhost/api/user/learning-progress');
    const response = await GET(request);

    expect(response.status).toBe(429);
  });
});
