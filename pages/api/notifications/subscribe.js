// In-memory storage
let subscriptions = new Map();

export default function handler(req, res) {
  // Enable CORS
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
      
      console.log('[Subscribe] Received subscription for user:', userId);
      console.log('[Subscribe] Subscription endpoint:', subscription.endpoint);
      
      // Store the subscription
      subscriptions.set(userId, subscription);
      
      console.log('[Subscribe] Total subscriptions:', subscriptions.size);
      console.log('[Subscribe] All users:', Array.from(subscriptions.keys()));
      
      res.status(200).json({ 
        success: true, 
        message: 'Subscribed successfully',
        userId: userId,
        totalSubscriptions: subscriptions.size
      });
    } catch (error) {
      console.error('[Subscribe] Error:', error);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      subscriptions.delete(userId);
      console.log('[Subscribe] Unsubscribed user:', userId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  } else if (req.method === 'GET') {
    const users = Array.from(subscriptions.keys());
    console.log('[Subscribe] GET - Total subscriptions:', subscriptions.size);
    res.status(200).json({ 
      totalSubscriptions: subscriptions.size,
      users: users 
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Export for use in other routes
export { subscriptions };
