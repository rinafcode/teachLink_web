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
      const { notificationId, event, userId, timestamp, message, title } = req.body;
      
      const logEntry = {
        id: notificationId || `unknown_${Date.now()}`,
        userId: userId || 'anonymous',
        event: event || 'unknown',
        timestamp: timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        message: message || title || '',
        title: title || ''
      };
      
      trackingLogs.unshift(logEntry);
      
      // Keep only last 200 logs
      if (trackingLogs.length > 200) {
        trackingLogs = trackingLogs.slice(0, 200);
      }
      
      console.log(`[Push Monitor] ${event} logged. Total logs: ${trackingLogs.length}`);
      
      res.status(200).json({ success: true, logCount: trackingLogs.length });
    } catch (error) {
      console.error('Tracking error:', error);
      res.status(500).json({ error: 'Failed to track event' });
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
      
      console.log(`[Push Monitor] GET - Total logs: ${trackingLogs.length}, Metrics:`, metrics);
      
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
      console.log('[Push Monitor] All logs cleared');
      res.status(200).json({ success: true, message: 'All logs cleared' });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
