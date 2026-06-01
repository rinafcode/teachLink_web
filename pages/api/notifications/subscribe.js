import { subscriptions } from '../../../lib/subscriptions';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const subscription = req.body;
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
      const { userId } = req.body;
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
