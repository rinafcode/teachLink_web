import { describe, it, expect, vi } from 'vitest';
// @ts-ignore
import sendNotificationHandler from '../../../../pages/api/notifications/send-notification.js';
// @ts-ignore
import trackHandler from '../../../../pages/api/notifications/track.js';
// @ts-ignore
import subscribeHandler from '../../../../pages/api/notifications/subscribe.js';

function mockReqRes(method: string, body: any) {
  const req = {
    method,
    body,
  };
  let statusResult = 200;
  let jsonResult: any = null;

  const res = {
    status(code: number) {
      statusResult = code;
      return this;
    },
    json(data: any) {
      jsonResult = data;
      return this;
    },
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };

  return { req, res, getStatus: () => statusResult, getJson: () => jsonResult };
}

describe('Notification API Input Validation', () => {
  // Mock external fetch for send-notification to avoid making actual HTTP requests
  vi.spyOn(global, 'fetch').mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as any),
  );

  describe('/api/notifications/send-notification', () => {
    it('should return 400 when body values are too long', async () => {
      const longString = 'a'.repeat(6000);
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        body: longString,
      });

      await sendNotificationHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toBe('Validation failed');
      expect(getJson().details.body).toBeDefined();
    });

    it('should return 400 when url is too long', async () => {
      const longUrl = 'http://example.com/' + 'a'.repeat(2100);
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        url: longUrl,
      });

      await sendNotificationHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toBe('Validation failed');
      expect(getJson().details.url).toBeDefined();
    });

    it('should pass validation for valid notification properties', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        userId: 'user_123',
        title: 'New message',
        body: 'You received a message',
        url: '/messages',
      });

      await sendNotificationHandler(req, res);

      expect(getStatus()).toBe(200);
      expect(getJson().success).toBe(true);
    });
  });

  describe('/api/notifications/track', () => {
    it('should return 400 on invalid event type', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        notificationId: 'notif_1',
        event: 'invalid_event_type',
      });

      await trackHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toBe('Validation failed');
      expect(getJson().details.event).toBeDefined();
    });

    it('should return 400 on excessively long messages', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        notificationId: 'notif_1',
        event: 'sent',
        message: 'a'.repeat(5100),
      });

      await trackHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toBe('Validation failed');
      expect(getJson().details.message).toBeDefined();
    });

    it('should pass validation for correct event properties', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        notificationId: 'notif_1',
        event: 'sent',
        userId: 'user_123',
        timestamp: new Date().toISOString(),
        message: 'Message delivered',
        title: 'Test',
      });

      await trackHandler(req, res);

      expect(getStatus()).toBe(200);
      expect(getJson().success).toBe(true);
    });
  });

  describe('/api/notifications/subscribe', () => {
    it('should return 400 on subscribe when endpoint is not a valid URL or is too long', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        endpoint: 'invalid-url',
        userId: 'a'.repeat(101),
      });

      await subscribeHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toBe('Validation failed');
      expect(getJson().details.userId).toBeDefined();
    });

    it('should return 400 on unsubscribe when userId is missing or empty', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('DELETE', {
        userId: '',
      });

      await subscribeHandler(req, res);

      expect(getStatus()).toBe(400);
      expect(getJson().error).toBe('Validation failed');
      expect(getJson().details.userId).toBeDefined();
    });

    it('should pass validation for valid subscribe request', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('POST', {
        endpoint: 'https://updates.teachlink.com/push/1234',
        userId: 'user_abc',
        keys: {
          p256dh: 'dhkey',
          auth: 'authkey',
        },
      });

      await subscribeHandler(req, res);

      expect(getStatus()).toBe(200);
      expect(getJson().success).toBe(true);
    });

    it('should pass validation for valid unsubscribe request', async () => {
      const { req, res, getStatus, getJson } = mockReqRes('DELETE', {
        userId: 'user_abc',
      });

      await subscribeHandler(req, res);

      expect(getStatus()).toBe(200);
      expect(getJson().success).toBe(true);
    });
  });
});
