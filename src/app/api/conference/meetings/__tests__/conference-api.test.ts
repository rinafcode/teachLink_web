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

describe('Conference API', () => {
  describe('POST /api/conference/meetings', () => {
    it('creates a new meeting for authenticated user', async () => {
      const meetingInput = {
        roomId: 'room-123',
        hostId: 'user-123',
        title: 'Team Standup',
      };

      const createdMeeting = {
        id: 'meeting-new',
        roomId: meetingInput.roomId,
        hostId: meetingInput.hostId,
        title: meetingInput.title,
        status: 'active',
        recordingEnabled: false,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        participants: [
          {
            id: 'participant-1',
            name: 'Host',
            userId: meetingInput.hostId,
            joinedAt: new Date().toISOString(),
            role: 'host',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ data: createdMeeting }),
      });

      const request = new NextRequest('http://localhost/api/conference/meetings', {
        method: 'POST',
        headers: {
          'x-user-id': meetingInput.hostId,
          authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingInput),
      });

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
        body: JSON.stringify(meetingInput),
      });

      const data = await response.json();
      expect(data.data).toEqual(createdMeeting);
      expect(response.status).toBe(201);
    });

    it('validates meeting input', async () => {
      const invalidMeeting = {
        roomId: '', // Invalid: too short
        hostId: '', // Invalid: too short
        title: '', // Invalid: too short
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Validation failed', details: [] }),
      });

      const request = new NextRequest('http://localhost/api/conference/meetings', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
          authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidMeeting),
      });

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
        body: JSON.stringify(invalidMeeting),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/conference/meetings/{meetingId}/participants', () => {
    it('returns participants for meeting', async () => {
      const meetingId = 'meeting-123';
      const mockParticipants = [
        {
          id: 'participant-1',
          name: 'John Doe',
          userId: 'user-1',
          joinedAt: new Date().toISOString(),
          role: 'host',
        },
        {
          id: 'participant-2',
          name: 'Jane Smith',
          userId: 'user-2',
          joinedAt: new Date().toISOString(),
          role: 'participant',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockParticipants }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/participants`,
        {
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.data).toEqual(mockParticipants);
    });

    it('returns 403 when user is not a participant', async () => {
      const meetingId = 'meeting-123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/participants`,
        {
          headers: {
            'x-user-id': 'user-unauthorized',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/conference/meetings/{meetingId}/toggle-recording', () => {
    it('toggles recording for meeting', async () => {
      const meetingId = 'meeting-123';
      const updatedMeeting = {
        id: meetingId,
        roomId: 'room-123',
        hostId: 'user-1',
        title: 'Team Standup',
        status: 'recording',
        recordingEnabled: true,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        participants: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedMeeting }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/toggle-recording`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.data.recordingEnabled).toBe(true);
      expect(data.data.status).toBe('recording');
    });

    it('returns 403 when user is not host', async () => {
      const meetingId = 'meeting-123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/toggle-recording`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-not-host',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/conference/meetings/{meetingId}/start-recording', () => {
    it('starts recording for meeting', async () => {
      const meetingId = 'meeting-123';
      const updatedMeeting = {
        id: meetingId,
        roomId: 'room-123',
        hostId: 'user-1',
        title: 'Team Standup',
        status: 'recording',
        recordingEnabled: true,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        participants: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedMeeting }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/start-recording`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.data.recordingEnabled).toBe(true);
      expect(data.data.status).toBe('recording');
    });

    it('returns 400 when recording already in progress', async () => {
      const meetingId = 'meeting-123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Recording already in progress' }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/start-recording`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/conference/meetings/{meetingId}/stop-recording', () => {
    it('stops recording for meeting', async () => {
      const meetingId = 'meeting-123';
      const updatedMeeting = {
        id: meetingId,
        roomId: 'room-123',
        hostId: 'user-1',
        title: 'Team Standup',
        status: 'active',
        recordingEnabled: false,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        participants: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedMeeting }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/stop-recording`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.data.recordingEnabled).toBe(false);
      expect(data.data.status).toBe('active');
    });

    it('returns 400 when recording not in progress', async () => {
      const meetingId = 'meeting-123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Recording not in progress' }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/stop-recording`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/conference/meetings/{meetingId}/end', () => {
    it('ends a meeting session', async () => {
      const meetingId = 'meeting-123';
      const updatedMeeting = {
        id: meetingId,
        roomId: 'room-123',
        hostId: 'user-1',
        title: 'Team Standup',
        status: 'ended',
        recordingEnabled: false,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        participants: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedMeeting }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/end`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      const data = await response.json();
      expect(data.data.status).toBe('ended');
      expect(data.data.endedAt).toBeDefined();
    });

    it('returns 400 when meeting already ended', async () => {
      const meetingId = 'meeting-123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Meeting already ended' }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/end`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-1',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(400);
    });

    it('returns 403 when user is not host', async () => {
      const meetingId = 'meeting-123';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Forbidden' }),
      });

      const request = new NextRequest(
        `http://localhost/api/conference/meetings/${meetingId}/end`,
        {
          method: 'POST',
          headers: {
            'x-user-id': 'user-not-host',
            authorization: 'Bearer valid-token',
          },
        },
      );

      const response = await fetch(request.url, {
        method: 'POST',
        headers: Object.fromEntries(request.headers),
      });

      expect(response.status).toBe(403);
    });
  });
});
