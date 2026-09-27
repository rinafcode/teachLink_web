import { logAuditMutation } from '@/middleware/audit';
import { appendAuditLog } from '@/lib/audit';

jest.mock('@/lib/audit');

test('actorId never contains an email address', () => {
  const mockRequest = new Request('http://example.com/api', {
    method: 'POST',
    headers: {
      'x-user-id': 'user-123',
    },
  });

  logAuditMutation(mockRequest, {
    action: 'create',
    targetType: 'document',
    targetId: 'doc-456',
    statusCode: 200,
  });

  const logged = (appendAuditLog as jest.Mock).mock.calls[0][0];
  expect(logged.actorId).not.toMatch(/@/);
  expect(logged.actorId).toBe('user-123');
});
