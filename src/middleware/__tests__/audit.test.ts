import { describe, expect, it, vi } from 'vitest';
import { logAuditMutation } from '../audit';

vi.mock('@/lib/audit', () => ({
  appendAuditLog: vi.fn(),
}));

import { appendAuditLog } from '@/lib/audit';

function createMockRequest(headers: Record<string, string> = {}): Request {
  return {
    url: 'http://localhost/api/notes',
    method: 'POST',
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as unknown as Request;
}

describe('logAuditMutation', () => {
  it('propagates the x-trace-id header into the audit entry', () => {
    const request = createMockRequest({ 'x-trace-id': 'trace_xyz' });
    logAuditMutation(request, {
      action: 'create',
      targetType: 'note',
      targetId: 'note_1',
      statusCode: 201,
    });

    expect(appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: 'trace_xyz' }),
    );
  });

  it('omits trace id when header is absent', () => {
    const request = createMockRequest();
    logAuditMutation(request, {
      action: 'create',
      targetType: 'note',
      targetId: 'note_1',
      statusCode: 201,
    });

    expect(appendAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: undefined }),
    );
  });
});
