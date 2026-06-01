import { subscriptions } from '../../../lib/subscriptions';

let trackingLogs = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { notificationId, event, userId, timestamp, message, title, error } = req.body;
      
      // Enhanced logging - shows full message body
      console.log('\n========================================');
      console.log('[📨 NOTIFICATION EVENT]');
      console.log(`   Event: ${event}`);
      console.log(`   ID: ${notificationId}`);
      console.log(`   User: ${userId || 'anonymous'}`);
      console.log(`   Time: ${timestamp || new Date().toISOString()}`);
      console.log(`   Message: "${message || title || 'No message'}"`);
      if (error) {
        console.log(`   ❌ Error: ${error}`);
      }
      console.log('========================================\n');
      
      const logEntry = {
        id: notificationId || `unknown_${Date.now()}`,
        userId: userId || 'anonymous',
        event: event || 'unknown',
        timestamp: timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        message: message || title || '',
        title: title || '',
        error: error || null
      };
      
      trackingLogs.unshift(logEntry);
      
      if (trackingLogs.length > 200) {
        trackingLogs = trackingLogs.slice(0, 200);
      }
      
      res.status(200).json({ success: true, logCount: trackingLogs.length });
    } catch (error) {
      console.error('[ERROR] Tracking failed:', error);
      res.status(500).json({ error: 'Failed to track event', details: error.message });
    }
  } else if (req.method === 'GET') {
    try {
      const recentLogs = trackingLogs.slice(0, 100);
      const metrics = {
        delivered: trackingLogs.filter(l => l.event === 'delivered').length,
        clicked: trackingLogs.filter(l => l.event === 'clicked').length,
        failed: trackingLogs.filter(l => l.event === 'failed').length,
        sent: trackingLogs.filter(l => l.event === 'sent').length
      };
      
      console.log(`[📊 METRICS] Sent: ${metrics.sent}, Delivered: ${metrics.delivered}, Clicked: ${metrics.clicked}, Failed: ${metrics.failed}`);
      
      res.status(200).json({
        total: trackingLogs.length,
        logs: recentLogs,
        metrics: metrics,
        activeSubscriptions: subscriptions.size
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  } else if (req.method === 'DELETE') {
    try {
      trackingLogs = [];
      console.log('[🗑️ LOGS CLEARED] All notification logs have been cleared');
      res.status(200).json({ success: true, message: 'All logs cleared' });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}