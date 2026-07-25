import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH, DELETE } from '../route';

// Mock the repository
vi.mock('@/lib/db/repositories/bookmarks.repository', () => ({
  findByUserAndLesson: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

// Mock rate limiting
vi.mock('@/lib/ratelimit', () => ({
  withRateLimit: vi.fn(() => ({
    addHeaders: (response: Response) => response,
    rateLimitResponse: null,
  })),
}));

// Mock audit logging
vi.mock('@/middleware/audit', () => ({
  logAuditMutation: vi.fn(),
}));

// Mock edge logging
vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

import * as bookmarksRepo from '@/lib/db/repositories/bookmarks.repository';

describe('/api/bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return bookmarks for a user and lesson', async () => {
      const mockBookmarks = [
        {
          id: 'bookmark-1',
          time: 30.5,
          title: 'Important part',
          note: 'Review this',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(bookmarksRepo.findByUserAndLesson).mockResolvedValue(mockBookmarks);

      const request = new Request('http://localhost/api/bookmarks?lessonId=lesson-1&userId=user-1');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockBookmarks);
      expect(bookmarksRepo.findByUserAndLesson).toHaveBeenCalledWith('user-1', 'lesson-1');
    });

    it('should return 400 for missing lessonId', async () => {
      const request = new Request('http://localhost/api/bookmarks?userId=user-1');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return empty array when no bookmarks exist', async () => {
      vi.mocked(bookmarksRepo.findByUserAndLesson).mockResolvedValue([]);

      const request = new Request('http://localhost/api/bookmarks?lessonId=lesson-1&userId=user-1');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(bookmarksRepo.findByUserAndLesson).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/bookmarks?lessonId=lesson-1&userId=user-1');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should create a new bookmark', async () => {
      const mockBookmark = {
        id: 'bookmark-123',
        time: 45.0,
        title: 'Key concept',
        note: 'Remember this',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(bookmarksRepo.create).mockResolvedValue(mockBookmark);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          bookmark: { time: 45.0, title: 'Key concept', note: 'Remember this' },
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Key concept');
    });

    it('should create a bookmark without optional note', async () => {
      const mockBookmark = {
        id: 'bookmark-123',
        time: 45.0,
        title: 'Key concept',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(bookmarksRepo.create).mockResolvedValue(mockBookmark);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          bookmark: { time: 45.0, title: 'Key concept' },
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('should return 400 for invalid payload', async () => {
      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          bookmark: { time: 45.0 }, // missing title
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(bookmarksRepo.create).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          bookmark: { time: 45.0, title: 'Key concept' },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH', () => {
    it('should update an existing bookmark', async () => {
      vi.mocked(bookmarksRepo.update).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'bookmark-123',
          title: 'Updated title',
          note: 'Updated note',
        }),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(bookmarksRepo.update).toHaveBeenCalledWith(
        'bookmark-123',
        'user-1',
        'lesson-1',
        { title: 'Updated title', note: 'Updated note', time: undefined },
      );
    });

    it('should update bookmark with new time', async () => {
      vi.mocked(bookmarksRepo.update).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'bookmark-123',
          title: 'Updated title',
          time: 60.0,
        }),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(bookmarksRepo.update).toHaveBeenCalledWith(
        'bookmark-123',
        'user-1',
        'lesson-1',
        { title: 'Updated title', note: undefined, time: 60.0 },
      );
    });

    it('should return 500 on database error', async () => {
      vi.mocked(bookmarksRepo.update).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'bookmark-123',
          title: 'Updated title',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE', () => {
    it('should delete a bookmark', async () => {
      vi.mocked(bookmarksRepo.remove).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'bookmark-123',
        }),
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(bookmarksRepo.remove).toHaveBeenCalledWith('bookmark-123', 'user-1', 'lesson-1');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(bookmarksRepo.remove).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/bookmarks', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'bookmark-123',
        }),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(500);
    });
  });
});
