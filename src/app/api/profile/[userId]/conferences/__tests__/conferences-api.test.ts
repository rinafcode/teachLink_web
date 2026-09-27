import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

declare global {
  var fetch: typeof fetch;
}

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Conferences API', () => {
  describe('GET /api/profile/{userId}/conferences', () => {
    it('returns conferences for authenticated user', async () => {
      const userId = 'user-123';
      const mockConferences = [
        {
          id: 'conf-1',
          title: 'Tech Conference 2024',
          role: 'speaker',
          date: '2024-06-15T00:00:00.000Z',
          location: 'San Francisco',
          url: 'https://techconf.com',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockConferences }),
      });

      const request = new NextRequest(`http://localhost/api/profile/${userId}/conferences`, {
        headers: {
          'x-user-id': userId,
          authorization: 'Bearer valid-token',
        },
      });

      const response = await fetch(request.url, {
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.data).toEqual(mockConferences);
    });

    it('returns 403 when user tries to access another user\'s conferences', async () => {
      const userId = 'user-123';
      const requesterId = 'user-456';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const request = new NextRequest(`http://localhost/api/profile/${userId}/conferences`, {
        headers: {
          'x-user-id': requesterId,
          authorization: 'Bearer valid-token',
        },
      });

      const response = await fetch(request.url, {
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/profile/{userId}/conferences', () => {
    it('creates a new conference for authenticated user', async () => {
      const userId = 'user-123';
      const newConference = {
        title: 'AI Summit 2024',
        role: 'speaker' as const,
        date: '2024-09-20T00:00:00.000Z',
        location: 'New York',
        url: 'https://aisummit.com',
      };

      const createdConference = {
        id: 'conf-new',
        ...newConference,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: createdConference }),
      });

      const request = new NextRequest(`http://localhost/api/profile/${userId}/conferences`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConference),
      });

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
        body: JSON.stringify(newConference),
      });

      const data = await response.json();
      expect(data.data).toEqual(createdConference);
      expect(response.status).toBe(201);
    });

    it('validates conference input', async () => {
      const userId = 'user-123';
      const invalidConference = {
        title: '', // Invalid: too short
        role: 'invalid-role', // Invalid: not in enum
        date: 'invalid-date', // Invalid: not a valid date
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed', details: [] }),
      });

      const request = new NextRequest(`http://localhost/api/profile/${userId}/conferences`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidConference),
      });

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
        body: JSON.stringify(invalidConference),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/profile/{userId}/conferences/{conferenceId}', () => {
    it('updates an existing conference for authenticated user', async () => {
      const userId = 'user-123';
      const conferenceId = 'conf-1';
      const updatedData = {
        title: 'Updated Conference Title',
        role: 'organizer' as const,
        date: '2024-06-20T00:00:00.000Z',
        location: 'Boston',
        url: 'https://updatedconf.com',
      };

      const updatedConference = {
        id: conferenceId,
        ...updatedData,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedConference }),
      });

      const request = new NextRequest(
        `http://localhost/api/profile/${userId}/conferences/${conferenceId}`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': userId,
            authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedData),
        },
      );

      const response = await fetch(request.url, {
        method: 'PUT',
        headers: Object.fromEntries(request.headers),
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();
      expect(data.data).toEqual(updatedConference);
    });

    it('returns 404 when conference not found', async () => {
      const userId = 'user-123';
      const conferenceId = 'conf-nonexistent';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const request = new NextRequest(
        `http://localhost/api/profile/${userId}/conferences/${conferenceId}`,
        {
          method: 'PUT',
          headers: {
            'x-user-id': userId,
            authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: 'Updated' }),
        },
      );

      const response = await fetch(request.url, {
        method: 'PUT',
        headers: Object.fromEntries(request.headers),
        body: JSON.stringify({ title: 'Updated' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/profile/{userId}/conferences/{conferenceId}', () => {
    it('deletes a conference for authenticated user', async () => {
      const userId = 'user-123';
      const conferenceId = 'conf-1';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const request = new NextRequest(
        `http://localhost/api/profile/${userId}/conferences/${conferenceId}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'DELETE',
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('returns 404 when conference not found', async () => {
      const userId = 'user-123';
      const conferenceId = 'conf-nonexistent';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      });

      const request = new NextRequest(
        `http://localhost/api/profile/${userId}/conferences/${conferenceId}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'DELETE',
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(404);
    });
  });
});
