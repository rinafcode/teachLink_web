/**
 * Security Tests for DB Metrics Endpoint
 *
 * Tests verify authentication and authorization:
 * - Anonymous requests return 401
 * - Non-admin roles return 403
 * - Admin role can access metrics
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { UserRole } from '@/types/api';

describe('DB Metrics Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for anonymous requests (no auth header)', async () => {
      const request = new NextRequest(new Request('http://localhost/api/performance/db-metrics'));
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 for requests with malformed auth header', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/performance/db-metrics', {
          headers: { authorization: 'InvalidFormat' },
        })
      );
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 401 for requests with Bearer token but no user-role cookie', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/performance/db-metrics', {
          headers: { authorization: 'Bearer some-token' },
        })
      );
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toBe('Unauthorized');
    });
  });

  describe('Authorization', () => {
    it('should return 403 for STUDENT role', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/performance/db-metrics', {
          headers: { authorization: 'Bearer student-token' },
        })
      );
      // Mock cookie for student role
      request.cookies.set('user-role', UserRole.STUDENT);
      
      const response = await GET(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toBe('Forbidden');
    });

    it('should return 403 for INSTRUCTOR role', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/performance/db-metrics', {
          headers: { authorization: 'Bearer instructor-token' },
        })
      );
      // Mock cookie for instructor role
      request.cookies.set('user-role', UserRole.INSTRUCTOR);
      
      const response = await GET(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toBe('Forbidden');
    });

    it('should return 403 for GUEST role', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/performance/db-metrics', {
          headers: { authorization: 'Bearer guest-token' },
        })
      );
      // Mock cookie for guest role
      request.cookies.set('user-role', UserRole.GUEST);
      
      const response = await GET(request);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.message).toBe('Forbidden');
    });

    it('should return metrics for ADMIN role', async () => {
      const request = new NextRequest(
        new Request('http://localhost/api/performance/db-metrics', {
          headers: { authorization: 'Bearer admin-token' },
        })
      );
      // Mock cookie for admin role
      request.cookies.set('user-role', UserRole.ADMIN);
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
      
      // Verify metric structure
      const metricNames = data.data.map((m: any) => m.name);
      expect(metricNames).toContain('db_pool_total_connections');
      expect(metricNames).toContain('db_pool_idle_connections');
      expect(metricNames).toContain('db_pool_waiting_clients');
      expect(metricNames).toContain('db_pool_active_connections');
    });
  });
});
