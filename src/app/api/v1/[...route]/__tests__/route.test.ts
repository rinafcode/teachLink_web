import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from '../route';

const mockFetch = vi.fn();

describe('API v1 catch-all proxy route', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockReset();
  });

  it('forwards GET requests to the original /api path', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const request = new Request('https://example.com/api/v1/courses', {
      method: 'GET',
      headers: { 'X-Test': 'true' },
    });

    const response = await GET(request as any, { params: { route: ['courses'] } });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/courses',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );

    const calledHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get('x-internal-api-request')).toBe('true');
    expect(calledHeaders.get('x-api-version')).toBe('v1');
    expect(response.headers.get('x-api-version')).toBe('v1');
    expect(await response.json()).toEqual({ success: true });
  });

  it('forwards POST requests with the request body to the original /api path', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ status: 'posted' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const body = { recipientId: 'user-123', amount: 0.05 };
    const request = new Request('https://example.com/api/v1/tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const response = await POST(request as any, { params: { route: ['tips'] } });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/tips',
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Headers),
      }),
    );

    const calledHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get('x-internal-api-request')).toBe('true');
    expect(calledHeaders.get('x-api-version')).toBe('v1');

    const requestBody = mockFetch.mock.calls[0][1].body as ArrayBuffer;
    const decodedBody = JSON.parse(new TextDecoder().decode(requestBody));
    expect(decodedBody).toEqual(body);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: 'posted' });
  });
});
