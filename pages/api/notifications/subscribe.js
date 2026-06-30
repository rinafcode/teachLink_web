import { subscriptions } from '../../../lib/subscriptions';
import {
  SubscribeNotificationSchema,
  UnsubscribeNotificationSchema,
} from '../../../src/schemas/notification.schema.ts';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const parsed = SubscribeNotificationSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const subscription = parsed.data;
      const userId = subscription.userId || 'anonymous';

      subscriptions.set(userId, subscription);

      console.log('[Push] Subscription stored for user:', userId);
      console.log('[Push] Total subscriptions:', subscriptions.size);

      res.status(200).json({
        success: true,
        message: 'Subscribed successfully',
        userId: userId,
      });
    } catch (error) {
      console.error('Subscription error:', error);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const parsed = UnsubscribeNotificationSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        });
      }
      const { userId } = parsed.data;
      subscriptions.delete(userId);
      console.log('[Push] Unsubscribed user:', userId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  } else if (req.method === 'GET') {
    const users = Array.from(subscriptions.keys());
    res.status(200).json({
      totalSubscriptions: subscriptions.size,
      users: users,
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
