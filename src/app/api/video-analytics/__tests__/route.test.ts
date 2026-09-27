import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

// Mock the repository
vi.mock('@/lib/db/repositories/video-events.repository', () => ({
  create: vi.fn(),
}));

// Mock rate limiting
vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

// Mock edge logging
vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

import * as videoEventsRepo from '@/lib/db/repositories/video-events.repository';

describe('/api/video-analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should record an analytics event', async () => {
      vi.mocked(videoEventsRepo.create).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          eventType: 'play',
          payload: { timestamp: 30.5 },
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(videoEventsRepo.create).toHaveBeenCalledWith(
        'user-1',
        'lesson-1',
        'play',
        { timestamp: 30.5 },
      );
    });

    it('should record event without userId (anonymous)', async () => {
      vi.mocked(videoEventsRepo.create).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'lesson-1',
          eventType: 'pause',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(videoEventsRepo.create).toHaveBeenCalledWith(
        undefined,
        'lesson-1',
        'pause',
        {},
      );
    });

    it('should record event with empty payload', async () => {
      vi.mocked(videoEventsRepo.create).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          eventType: 'complete',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(videoEventsRepo.create).toHaveBeenCalledWith(
        'user-1',
        'lesson-1',
        'complete',
        {},
      );
    });

    it('should return 400 for missing lessonId', async () => {
      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          eventType: 'play',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toBe('Invalid payload');
    });

    it('should return 400 for missing eventType', async () => {
      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(videoEventsRepo.create).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          eventType: 'play',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should handle complex payload objects', async () => {
      vi.mocked(videoEventsRepo.create).mockResolvedValue(undefined);

      const complexPayload = {
        currentTime: 45.5,
        duration: 120,
        volume: 0.8,
        playbackRate: 1.5,
        quality: '1080p',
        metadata: {
          browser: 'Chrome',
          platform: 'Windows',
        },
      };

      const request = new Request('http://localhost/api/video-analytics', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          eventType: 'progress',
          payload: complexPayload,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(videoEventsRepo.create).toHaveBeenCalledWith(
        'user-1',
        'lesson-1',
        'progress',
        complexPayload,
      );
    });
  });
});
