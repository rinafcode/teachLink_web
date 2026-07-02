import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH, DELETE } from '../route';

// Mock the repository
vi.mock('@/lib/db/repositories/notes.repository', () => ({
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

import * as notesRepo from '@/lib/db/repositories/notes.repository';

describe('/api/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return notes for a user and lesson', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          time: 30.5,
          text: 'Test note',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      vi.mocked(notesRepo.findByUserAndLesson).mockResolvedValue(mockNotes);

      const request = new Request('http://localhost/api/notes?lessonId=lesson-1&userId=user-1');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockNotes);
      expect(notesRepo.findByUserAndLesson).toHaveBeenCalledWith('user-1', 'lesson-1');
    });

    it('should return 400 for missing lessonId', async () => {
      const request = new Request('http://localhost/api/notes?userId=user-1');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return empty array when no notes exist', async () => {
      vi.mocked(notesRepo.findByUserAndLesson).mockResolvedValue([]);

      const request = new Request('http://localhost/api/notes?lessonId=lesson-1&userId=user-1');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual([]);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(notesRepo.findByUserAndLesson).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/notes?lessonId=lesson-1&userId=user-1');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should create a new note', async () => {
      const mockNote = {
        id: 'note-123',
        time: 45.0,
        text: 'New note',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      vi.mocked(notesRepo.create).mockResolvedValue(mockNote);

      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          note: { time: 45.0, text: 'New note' },
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.text).toBe('New note');
    });

    it('should return 400 for invalid payload', async () => {
      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          note: { time: 'invalid' }, // missing text, invalid time
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(notesRepo.create).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/notes', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          note: { time: 45.0, text: 'New note' },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH', () => {
    it('should update an existing note', async () => {
      vi.mocked(notesRepo.update).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/notes', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'note-123',
          text: 'Updated text',
        }),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(notesRepo.update).toHaveBeenCalledWith(
        'note-123',
        'user-1',
        'lesson-1',
        { text: 'Updated text', time: undefined },
      );
    });

    it('should update note with new time', async () => {
      vi.mocked(notesRepo.update).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/notes', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'note-123',
          text: 'Updated text',
          time: 60.0,
        }),
      });

      const response = await PATCH(request);

      expect(response.status).toBe(200);
      expect(notesRepo.update).toHaveBeenCalledWith(
        'note-123',
        'user-1',
        'lesson-1',
        { text: 'Updated text', time: 60.0 },
      );
    });

    it('should return 500 on database error', async () => {
      vi.mocked(notesRepo.update).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/notes', {
        method: 'PATCH',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'note-123',
          text: 'Updated text',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE', () => {
    it('should delete a note', async () => {
      vi.mocked(notesRepo.remove).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/notes', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'note-123',
        }),
      });

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(notesRepo.remove).toHaveBeenCalledWith('note-123', 'user-1', 'lesson-1');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(notesRepo.remove).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/notes', {
        method: 'DELETE',
        body: JSON.stringify({
          userId: 'user-1',
          lessonId: 'lesson-1',
          id: 'note-123',
        }),
      });

      const response = await DELETE(request);
      expect(response.status).toBe(500);
    });
  });
});
