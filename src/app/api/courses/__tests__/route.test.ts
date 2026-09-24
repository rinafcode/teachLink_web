import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { resetCourseListConfig } from '@/lib/course-config';

// Route sits behind a trusted proxy; without it getClientIP would ignore the
// x-forwarded-for header and collapse all requests into one rate-limit bucket.
const TRUSTED_PROXY = '10.0.0.1';
const ORIGINAL_TRUSTED_PROXY_IPS = process.env.TRUSTED_PROXY_IPS;

function makeRequest(query = ''): Request {
  return new Request(`http://localhost/api/courses${query}`, {
    headers: {
      'x-forwarded-for': `10.20.30.${Math.floor(Math.random() * 254) + 1}`,
      'cf-connecting-ip': TRUSTED_PROXY,
    },
  });
}

describe('/api/courses GET', () => {
  beforeEach(() => {
    resetCourseListConfig();
    process.env.TRUSTED_PROXY_IPS = TRUSTED_PROXY;
  });

  afterEach(() => {
    if (ORIGINAL_TRUSTED_PROXY_IPS === undefined) {
      delete process.env.TRUSTED_PROXY_IPS;
    } else {
      process.env.TRUSTED_PROXY_IPS = ORIGINAL_TRUSTED_PROXY_IPS;
    }
  });

  it('returns 200 with a paginated list of courses', async () => {
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.total).toBe(6);
  });

  it('paginates using limit and cursor', async () => {
    const first = await GET(makeRequest('?limit=2'));
    const firstJson = await first.json();

    expect(firstJson.data).toHaveLength(2);
    expect(firstJson.nextCursor).toBe('2');

    const second = await GET(makeRequest(`?limit=2&cursor=${firstJson.nextCursor}`));
    const secondJson = await second.json();

    expect(secondJson.data).toHaveLength(2);
    expect(secondJson.nextCursor).toBe('4');
  });

  it('filters by the featured flag', async () => {
    const response = await GET(makeRequest('?featured=true'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.length).toBeGreaterThan(0);
    for (const course of json.data) {
      expect(course.featured).toBe(true);
    }
  });

  it('excludes non-featured courses when featured=false', async () => {
    const response = await GET(makeRequest('?featured=false'));
    const json = await response.json();

    for (const course of json.data) {
      expect(course.featured).toBe(false);
    }
  });

  it('omits nextCursor on the last page', async () => {
    const response = await GET(makeRequest('?limit=100'));
    const json = await response.json();

    expect(json.nextCursor).toBeUndefined();
  });

  it('returns all required variables declared and typed correctly', async () => {
    const response = await GET(makeRequest());
    const json = await response.json();

    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('total');
    expect(typeof json.total).toBe('number');
  });
});
