/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from '@/app/api/generate-pdf/route';
import * as pdfService from '@/services/pdf-generation';

// Helper to create a NextRequest with JSON body
function createRequest(body: any): Request {
  return new Request('http://localhost/api/generate-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }) as any; // cast to satisfy NextRequest type
}

describe('PDF generation timeout handling', () => {
  const originalTimeout = process.env.PDF_TIMEOUT_MS;

  beforeEach(() => {
    // Set a very short timeout to trigger the guard quickly
    process.env.PDF_TIMEOUT_MS = '100'; // 100ms
  });

  afterEach(() => {
    // Restore env and reset mocks
    process.env.PDF_TIMEOUT_MS = originalTimeout;
    vi.restoreAllMocks();
  });

  it('should return 504 when PDF generation exceeds timeout', async () => {
    // Mock generatePDF to delay beyond the timeout
    vi.spyOn(pdfService, 'generatePDF').mockImplementation(() => {
      return new Promise((_resolve) => {
        // Never resolve, simulating a hang
      });
    });

    const request = createRequest({ html: '<html></html>' });
    const response = (await POST(request as any)) as NextResponse;

    // Verify status 504 and error payload
    expect(response.status).toBe(504);
    const json = await response.json();
    expect(json).toEqual({
      error: 'PDF generation timed out, please retry',
      timeout: 100,
      retry_after: 5,
    });
  });
});
