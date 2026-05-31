const webpush = require('web-push');
import { subscriptions } from '../../../lib/subscriptions';

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@teachlink.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Helper to track events
async function trackEvent(notificationId, event, userId, error = null) {
  try {
    await fetch('http://localhost:3000/api/notifications/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notificationId,
        event: event,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString(),
        error: error
      })
    });
  } catch (err) {
    console.error('Failed to track event:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, title, body, url } = req.body;
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    console.log('[Push] Sending real notification:', { notificationId, userId, title, body });
    console.log('[Push] Current subscriptions:', Array.from(subscriptions.keys()));
    
    // Track sent event
    await trackEvent(notificationId, 'sent', userId);
    
    // Get the user's subscription
    const subscription = subscriptions.get(userId);
    
    if (!subscription) {
      console.log('[Push] No subscription found for user:', userId);
      console.log('[Push] Available users:', Array.from(subscriptions.keys()));
      return res.status(404).json({ 
        error: 'User not subscribed. Please enable notifications first.',
        notificationId,
        availableUsers: Array.from(subscriptions.keys())
      });
    }
    
    console.log('[Push] Found subscription for user:', userId);
    
    const payload = JSON.stringify({
      id: notificationId,
      title: title || 'TeachLink Notification',
      body: body || 'You have a new notification',
      url: url || '/',
      timestamp: new Date().toISOString(),
    });
    
    // Send real push notification
    await webpush.sendNotification(subscription, payload);
    
    console.log('[Push] Real notification sent successfully to:', userId);
    
    res.status(200).json({
      success: true,
      notificationId: notificationId,
      message: 'Real push notification sent successfully!'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    
    // Track failed event
    await trackEvent(`failed_${Date.now()}`, 'failed', 'anonymous', error.message);
    
    res.status(500).json({ 
      error: 'Failed to send notification', 
      details: error.message 
    });
  }
}
