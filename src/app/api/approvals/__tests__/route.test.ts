import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH } from '../route';

// Mock the database query
vi.mock('@/lib/db/pool', () => ({
  query: vi.fn(),
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

import { query } from '@/lib/db/pool';

describe('/api/approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return all approvals', async () => {
      const mockApprovals = [
        {
          id: 'approval-1',
          contentId: 'course-1',
          contentType: 'COURSE',
          title: 'Test Course',
          submittedBy: 'user-1',
          submittedAt: '2024-01-01T00:00:00.000Z',
          status: 'PENDING',
        },
      ];

      vi.mocked(query).mockResolvedValue({ rows: mockApprovals, rowCount: 1 } as never);

      const request = new Request('http://localhost/api/approvals');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockApprovals);
    });

    it('should filter approvals by status', async () => {
      vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 } as never);

      const request = new Request('http://localhost/api/approvals?status=PENDING');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('WHERE'), ['PENDING']);
    });

    it('should return 400 for invalid status', async () => {
      const request = new Request('http://localhost/api/approvals?status=INVALID');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(query).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/approvals');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST', () => {
    it('should create a new approval request', async () => {
      const mockApproval = {
        id: 'approval-123',
        contentId: 'course-1',
        contentType: 'COURSE',
        title: 'New Course',
        submittedBy: 'user-1',
        submittedAt: '2024-01-01T00:00:00.000Z',
        status: 'PENDING',
      };

      vi.mocked(query).mockResolvedValue({ rows: [mockApproval], rowCount: 1 } as never);

      const request = new Request('http://localhost/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 'course-1',
          contentType: 'COURSE',
          title: 'New Course',
          submittedBy: 'user-1',
        }),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('PENDING');
    });

    it('should return 400 for missing required fields', async () => {
      const request = new Request('http://localhost/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 'course-1',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 500 on database error', async () => {
      vi.mocked(query).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/approvals', {
        method: 'POST',
        body: JSON.stringify({
          contentId: 'course-1',
          contentType: 'COURSE',
          title: 'New Course',
          submittedBy: 'user-1',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH', () => {
    it('should approve a pending approval', async () => {
      const updatedApproval = {
        id: 'approval-123',
        contentId: 'course-1',
        contentType: 'COURSE',
        title: 'Test Course',
        submittedBy: 'user-1',
        submittedAt: '2024-01-01T00:00:00.000Z',
        status: 'APPROVED',
        reviewedBy: 'admin-1',
        reviewedAt: '2024-01-02T00:00:00.000Z',
      };

      vi.mocked(query).mockResolvedValue({ rows: [updatedApproval], rowCount: 1 } as never);

      const request = new Request('http://localhost/api/approvals', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'approval-123',
          status: 'APPROVED',
          reviewedBy: 'admin-1',
        }),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('APPROVED');
    });

    it('should return 404 for non-existent approval', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

      const request = new Request('http://localhost/api/approvals', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'non-existent',
          status: 'APPROVED',
          reviewedBy: 'admin-1',
        }),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.message).toBe('Approval not found');
    });

    it('should return 409 for already reviewed approval', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)
        .mockResolvedValueOnce({ rows: [{ id: 'approval-123' }], rowCount: 1 } as never);

      const request = new Request('http://localhost/api/approvals', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'approval-123',
          status: 'REJECTED',
          reviewedBy: 'admin-2',
        }),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.message).toBe('Only PENDING approvals can be reviewed');
    });

    it('should return 500 on database error', async () => {
      vi.mocked(query).mockRejectedValue(new Error('DB error'));

      const request = new Request('http://localhost/api/approvals', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'approval-123',
          status: 'APPROVED',
          reviewedBy: 'admin-1',
        }),
      });

      const response = await PATCH(request);
      expect(response.status).toBe(500);
    });
  });
});
