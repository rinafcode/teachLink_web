import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '../route';
import { UserRole } from '@/types/api';
import crypto from 'crypto';

vi.mock('@/../infra/edge-config', () => ({
  edgeLog: vi.fn(),
}));

function createTestToken(payload: { sub: string; role: string; email?: string }): string {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-1234567890!';
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + 3600 };

  const base64UrlEncode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(fullPayload);
  const dataToSign = `${headerB64}.${payloadB64}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

describe('Profile API Route (/api/user/profile)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-key-1234567890!';
  });

  it('GET returns default profile when no token is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/profile');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('John Doe');
  });

  it('GET returns authenticated user profile when valid token is provided', async () => {
    const token = createTestToken({
      sub: 'user-789',
      role: UserRole.STUDENT,
      email: 'alice.smith@example.com',
    });

    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('Alice Smith');
    expect(json.data.email).toBe('alice.smith@example.com');
    expect(json.data.initials).toBe('AS');
  });

  it('PUT updates profile data correctly', async () => {
    const token = createTestToken({
      sub: 'user-789',
      role: UserRole.STUDENT,
      email: 'alice.smith@example.com',
    });

    const updateReq = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Alice Johnson',
        bio: 'Updated bio for Alice',
      }),
    });

    const res = await PUT(updateReq);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.name).toBe('Alice Johnson');
    expect(json.data.initials).toBe('AJ');
    expect(json.data.bio).toBe('Updated bio for Alice');
  });
});
