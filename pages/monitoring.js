import { useEffect, useState, useRef } from "react";

export default function MonitoringPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [metrics, setMetrics] = useState({ delivered: 0, clicked: 0, failed: 0, sent: 0 });
  const [logs, setLogs] = useState([]);
  const [testMessage, setTestMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [systemMetrics, setSystemMetrics] = useState({
    memory: { heapUsed: 0, heapTotal: 0, rss: 0 },
    cpu: { user: 0, system: 0 },
    uptime: 0,
    platform: ''
  });
  const inputRef = useRef(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/notifications/track");
      const data = await response.json();
      setMetrics(data.metrics || { delivered: 0, clicked: 0, failed: 0, sent: 0 });
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch("/api/notifications/metrics");
      const data = await response.json();
      setSystemMetrics({
        memory: {
          heapUsed: (data.memory.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: (data.memory.heapTotal / 1024 / 1024).toFixed(2),
          rss: (data.memory.rss / 1024 / 1024).toFixed(2)
        },
        cpu: {
          user: (data.cpu.user / 1000000).toFixed(2),
          system: (data.cpu.system / 1000000).toFixed(2)
        },
        uptime: (data.uptime / 60).toFixed(1),
        platform: data.system.platform,
        nodeVersion: data.system.nodeVersion
      });
    } catch (error) {
      console.error("Failed to fetch system metrics:", error);
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notification-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = async () => {
    if (confirm("Are you sure you want to clear all logs?")) {
      const response = await fetch("/api/notifications/track", { method: "DELETE" });
      if (response.ok) {
        alert("Logs cleared successfully!");
        fetchMetrics();
      } else {
        alert("Failed to clear logs");
      }
    }
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }
    
    if (!('serviceWorker' in navigator)) {
      alert('Service workers are not supported');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied');
        return;
      }
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
      
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          userId: 'anonymous'
        })
      });
      
      if (response.ok) {
        setIsSubscribed(true);
        alert('Successfully subscribed to push notifications!');
        fetchMetrics();
      } else {
        alert('Failed to subscribe on server');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to subscribe: ' + error.message);
    }
  };

  const sendTestNotification = async () => {
    const message = testMessage.trim();
    if (!message) {
      alert("Please enter a message");
      return;
    }
    
    if (!isSubscribed) {
      alert("Please enable notifications first!");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "anonymous",
          title: "TeachLink Notification",
          body: message,
          url: "/"
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Notification sent! Message: "${message}"`);
        setTestMessage("");
        if (inputRef.current) inputRef.current.value = "";
        setTimeout(fetchMetrics, 1000);
        setTimeout(fetchSystemMetrics, 1000);
      } else {
        alert("❌ Failed to send: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to send: " + error.message);
    }
    setIsLoading(false);
  };

  // Filter logs based on selected filter
  const filteredLogs = logs.filter(log => {
    if (logFilter === "all") return true;
    return log.event === logFilter;
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
    };
    
    fetchMetrics();
    fetchSystemMetrics();
    checkSubscription();
    
    const interval = setInterval(() => {
      fetchMetrics();
      fetchSystemMetrics();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Dark mode styles
  const bgColor = darkMode ? '#1a1a2e' : '#ffffff';
  const textColor = darkMode ? '#ffffff' : '#000000';
  const cardBg = darkMode ? '#16213e' : '#f3f4f6';
  const borderColor = darkMode ? '#0f3460' : '#e5e7eb';
  const tableBg = darkMode ? '#0f3460' : '#f9fafb';

  const displayLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 10);

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto", fontFamily: "Arial, sans-serif", background: bgColor, color: textColor, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
          🔔 Push Notification Monitoring Dashboard
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ padding: "8px 16px", background: darkMode ? "#f3f4f6" : "#1a1a2e", color: darkMode ? "#000" : "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
      
      {/* System Metrics Section */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>📊 System Metrics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px", background: cardBg, borderRadius: "8px", border: `1px solid ${borderColor}` }}>
            <div style={{ fontSize: "12px", color: darkMode ? "#aaa" : "#666", marginBottom: "4px" }}>💾 Memory Usage</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{systemMetrics.memory.heapUsed} MB</div>
            <div style={{ fontSize: "11px", color: darkMode ? "#888" : "#999" }}>Heap: {systemMetrics.memory.heapTotal} MB | RSS: {systemMetrics.memory.rss} MB</div>
          </div>
          <div style={{ padding: "16px", background: cardBg, borderRadius: "8px", border: `1px solid ${borderColor}` }}>
            <div style={{ fontSize: "12px", color: darkMode ? "#aaa" : "#666", marginBottom: "4px" }}>⚙️ CPU Time</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{systemMetrics.cpu.user} sec</div>
            <div style={{ fontSize: "11px", color: darkMode ? "#888" : "#999" }}>System: {systemMetrics.cpu.system} sec</div>
          </div>
          <div style={{ padding: "16px", background: cardBg, borderRadius: "8px", border: `1px solid ${borderColor}` }}>
            <div style={{ fontSize: "12px", color: darkMode ? "#aaa" : "#666", marginBottom: "4px" }}>⏱️ Uptime</div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>{systemMetrics.uptime} minutes</div>
            <div style={{ fontSize: "11px", color: darkMode ? "#888" : "#999" }}>{systemMetrics.platform} | Node {systemMetrics.nodeVersion}</div>
          </div>
        </div>
      </div>
      
      {/* Notification Status Section */}
      <div style={{ marginBottom: "24px", padding: "16px", background: cardBg, borderRadius: "8px", border: `1px solid ${borderColor}` }}>
        <p style={{ margin: 0 }}><strong>Status:</strong> {isSubscribed ? "✅ Subscribed to real notifications" : "❌ Not subscribed"}</p>
        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: darkMode ? "#aaa" : "#666" }}>
          {isSubscribed ? "You will receive real push notifications" : "Click the button below to enable real notifications"}
        </p>
        {!isSubscribed && (
          <button
            onClick={enableNotifications}
            style={{ marginTop: "12px", padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Enable Real Notifications
          </button>
        )}
      </div>
      
      {/* Metrics Counters */}
      <div style={{ marginBottom: "24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div style={{ padding: "16px", background: "#dbeafe", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.sent || 0}</div>
          <div style={{ fontSize: "14px", color: "#1e40af" }}>📤 Sent</div>
        </div>
        <div style={{ padding: "16px", background: "#dcfce7", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.delivered || 0}</div>
          <div style={{ fontSize: "14px", color: "#166534" }}>📨 Delivered</div>
        </div>
        <div style={{ padding: "16px", background: "#dbeafe", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.clicked || 0}</div>
          <div style={{ fontSize: "14px", color: "#1e40af" }}>👆 Clicked</div>
        </div>
        <div style={{ padding: "16px", background: "#fee2e2", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.failed || 0}</div>
          <div style={{ fontSize: "14px", color: "#991b1b" }}>❌ Failed</div>
        </div>
      </div>
      
      {/* Send Test Notification */}
      <div style={{ marginBottom: "24px", padding: "16px", border: `1px solid ${borderColor}`, borderRadius: "8px", background: cardBg }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>Send Test Notification</h2>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter test message..."
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          style={{ width: "100%", padding: "10px", border: `1px solid ${borderColor}`, borderRadius: "4px", marginBottom: "12px", fontSize: "14px", background: bgColor, color: textColor }}
        />
        <button
          onClick={sendTestNotification}
          disabled={isLoading || !isSubscribed}
          style={{ padding: "10px 20px", background: (isLoading || !isSubscribed) ? "#9ca3af" : "#8b5cf6", color: "white", border: "none", borderRadius: "4px", cursor: (isLoading || !isSubscribed) ? "not-allowed" : "pointer", fontSize: "14px" }}
        >
          {isLoading ? "Sending..." : "📤 Send Test Notification"}
        </button>
        {!isSubscribed && (
          <p style={{ marginTop: "8px", fontSize: "12px", color: "#f59e0b" }}>
            ⚠️ Please enable notifications first
          </p>
        )}
      </div>
      
      {/* Logs Viewer */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>📋 Notification Logs ({filteredLogs.length} events)</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              style={{ padding: "6px 12px", border: `1px solid ${borderColor}`, borderRadius: "4px", background: bgColor, color: textColor, cursor: "pointer" }}
            >
              <option value="all">All Events</option>
              <option value="sent">📤 Sent Only</option>
              <option value="delivered">📨 Delivered Only</option>
              <option value="clicked">👆 Clicked Only</option>
              <option value="failed">❌ Failed Only</option>
            </select>
            <button
              onClick={() => setShowAllLogs(!showAllLogs)}
              style={{ padding: "6px 12px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              {showAllLogs ? "Show Recent 10" : "Show All Logs"}
            </button>
            <button
              onClick={exportLogs}
              style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              📥 Export JSON
            </button>
            <button
              onClick={clearLogs}
              style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>
        
        <div style={{ border: `1px solid ${borderColor}`, borderRadius: "8px", overflow: "auto", maxHeight: "500px", background: tableBg }}>
          <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
            <thead style={{ background: darkMode ? "#0f3460" : "#e5e7eb", position: "sticky", top: 0 }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>#</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Time</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Event</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Message</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>Notification ID</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: `1px solid ${borderColor}` }}>User ID</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                    No logs yet. Send a test notification to see events!
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderTop: `1px solid ${borderColor}` }}>
                    <td style={{ padding: "12px" }}>{idx + 1}</td>
                    <td style={{ padding: "12px" }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ 
                        padding: "4px 12px", 
                        borderRadius: "20px", 
                        background: log.event === 'sent' ? '#dbeafe' : log.event === 'delivered' ? '#dcfce7' : log.event === 'clicked' ? '#dbeafe' : '#fee2e2',
                        fontSize: "12px",
                        fontWeight: "bold"
                      }}>
                        {log.event === 'sent' ? '📤 Sent' : log.event === 'delivered' ? '📨 Delivered' : log.event === 'clicked' ? '👆 Clicked' : '❌ Failed'}
                      </span>
                     <td>
                    <td style={{ padding: "12px", maxWidth: "200px", wordBreak: "break-word" }}>{log.message || log.title || '-'}</td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "11px" }}>{log.id}</td>
                    <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "11px" }}>{log.userId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!showAllLogs && filteredLogs.length > 10 && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <button
              onClick={() => setShowAllLogs(true)}
              style={{ padding: "8px 16px", background: "#8b5cf6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              View All {filteredLogs.length} Logs
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div style={{ marginTop: "32px", padding: "16px", borderTop: `1px solid ${borderColor}`, textAlign: "center", fontSize: "12px", color: darkMode ? "#aaa" : "#6b7280" }}>
        <p>✅ Real Push Notification Monitoring System | v1.0</p>
        <p>📤 Sent | 📨 Delivered | 👆 Clicked | ❌ Failed | 💾 Memory | ⚙️ CPU</p>
      </div>
    </div>
  );
}
