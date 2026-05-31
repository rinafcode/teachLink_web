'use client';

import { useEffect, useState } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Metrics {
  delivered: number;
  clicked: number;
  failed: number;
}

interface LogEntry {
  id: string;
  userId: string;
  event: string;
  timestamp: string;
}

export default function PushNotificationMonitor() {
  const { isSubscribed, subscribe, unsubscribe, isSupported } = usePushNotifications();
  const [metrics, setMetrics] = useState<Metrics>({ delivered: 0, clicked: 0, failed: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('');

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/notifications/track');
      const data = await response.json();
      setMetrics(data.metrics || { delivered: 0, clicked: 0, failed: 0 });
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const sendTestNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          title: 'Test Notification',
          body: testMessage || 'This is a test notification from TeachLink!',
          url: '/',
        }),
      });
      
      if (response.ok) {
        alert('Test notification sent!');
        setTimeout(fetchMetrics, 2000);
      } else {
        alert('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Error sending test notification');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 rounded">
        ⚠️ Push notifications are not supported in your browser
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Push Notification Monitoring Dashboard</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Subscription Status</h2>
        <p>Status: {isSubscribed ? '✅ Subscribed' : '❌ Not subscribed'}</p>
        {!isSubscribed ? (
          <button
            onClick={subscribe}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Enable Notifications
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disable Notifications
          </button>
        )}
      </div>
      
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-100 rounded">
          <div className="text-2xl font-bold">{metrics.delivered}</div>
          <div className="text-sm">Delivered</div>
        </div>
        <div className="p-4 bg-blue-100 rounded">
          <div className="text-2xl font-bold">{metrics.clicked}</div>
          <div className="text-sm">Clicked</div>
        </div>
        <div className="p-4 bg-red-100 rounded">
          <div className="text-2xl font-bold">{metrics.failed}</div>
          <div className="text-sm">Failed</div>
        </div>
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Send Test Notification</h2>
        <input
          type="text"
          placeholder="Optional: Custom message"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={sendTestNotification}
          disabled={loading || !isSubscribed}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </button>
        {!isSubscribed && (
          <p className="text-sm text-gray-500 mt-2">
            ⚠️ Please enable notifications first
          </p>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Recent Events</h2>
        <div className="border rounded overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Event</th>
                <th className="p-2 text-left">Notification ID</th>
                <th className="p-2 text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().map((log, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.event === 'delivered' ? 'bg-green-200' :
                      log.event === 'clicked' ? 'bg-blue-200' :
                      log.event === 'failed' ? 'bg-red-200' : 'bg-gray-200'
                    }`}>
                      {log.event}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs">{log.id.substring(0, 20)}...</td>
                  <td className="p-2">{log.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
