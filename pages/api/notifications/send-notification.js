const webpush = require('web-push');

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@teachlink.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

let subscriptions = new Map();

export default async function handler(req, res) {
  console.log('[Send-Notification] Request received:', req.method);
  
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ready', 
      message: 'Send notification endpoint is working',
      subscriptions: subscriptions.size
    });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST or GET.' });
  }

  try {
    const { userId, title, body, url } = req.body;
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log('[Send-Notification] Processing:', { notificationId, userId, title, body });
    
    // Track sent event with message content
    await fetch('http://localhost:3000/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notificationId,
        event: 'sent',
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        message: body,
        title: title
      })
    }).catch(err => console.error('Track error:', err));
    
    console.log('[Send-Notification] Success for:', userId);
    
    res.status(200).json({ 
      success: true, 
      notificationId: notificationId,
      message: 'Notification recorded successfully',
      content: body
    });
  } catch (error) {
    console.error('[Send-Notification] Error:', error);
    res.status(500).json({ error: error.message });
  }
}
