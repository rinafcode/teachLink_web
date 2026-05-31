import { useEffect, useState } from "react";

export default function WorkingDashboard() {
  const [metrics, setMetrics] = useState({ sent: 0, delivered: 0, clicked: 0, failed: 0 });
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/notifications/track");
      const data = await res.json();
      setMetrics(data.metrics || { sent: 0, delivered: 0, clicked: 0, failed: 0 });
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const sendNotification = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "anonymous",
          title: "Test Notification",
          body: message
        })
      });
      if (res.ok) {
        alert("Notification sent: " + message);
        setMessage("");
        fetchData();
      } else {
        alert("Failed to send");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    container: {
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      background: darkMode ? "#1a1a2e" : "#fff",
      color: darkMode ? "#fff" : "#000",
      minHeight: "100vh"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px"
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "16px",
      marginBottom: "20px"
    },
    metricCard: {
      padding: "16px",
      borderRadius: "8px",
      textAlign: "center"
    },
    card: {
      background: darkMode ? "#16213e" : "#f3f4f6",
      padding: "16px",
      borderRadius: "8px",
      marginBottom: "20px"
    },
    input: {
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      fontSize: "14px"
    },
    button: {
      padding: "10px 20px",
      background: "#8b5cf6",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px"
    },
    buttonDisabled: {
      padding: "10px 20px",
      background: "#9ca3af",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "not-allowed",
      fontSize: "14px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "13px"
    },
    th: {
      padding: "10px",
      textAlign: "left",
      background: darkMode ? "#0f3460" : "#e5e7eb",
      borderBottom: "1px solid #ccc"
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #ccc"
    },
    darkButton: {
      padding: "8px 16px",
      background: darkMode ? "#f3f4f6" : "#1a1a2e",
      color: darkMode ? "#000" : "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ margin: 0 }}>🔔 Push Notification Monitor</h1>
        <button onClick={() => setDarkMode(!darkMode)} style={styles.darkButton}>
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Metrics Section */}
      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, background: "#dbeafe" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.sent}</div>
          <div>📤 Sent</div>
        </div>
        <div style={{ ...styles.metricCard, background: "#dcfce7" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.delivered}</div>
          <div>📨 Delivered</div>
        </div>
        <div style={{ ...styles.metricCard, background: "#dbeafe" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.clicked}</div>
          <div>👆 Clicked</div>
        </div>
        <div style={{ ...styles.metricCard, background: "#fee2e2" }}>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.failed}</div>
          <div>❌ Failed</div>
        </div>
      </div>

      {/* Send Notification Section */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 12px 0" }}>Send Test Notification</h3>
        <input
          type="text"
          placeholder="Enter your notification message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={sendNotification}
          disabled={loading}
          style={loading ? styles.buttonDisabled : styles.button}
        >
          {loading ? "Sending..." : "📤 Send Notification"}
        </button>
      </div>

      {/* Recent Events Section */}
      <div style={styles.card}>
        <h3 style={{ margin: "0 0 12px 0" }}>📋 Recent Events ({logs.length})</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Message</th>
                <th style={styles.th}>Notification ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                    No events yet. Send a test notification!
                  </td>
                </tr>
              ) : (
                logs.slice(0, 20).map((log, index) => (
                  <tr key={index}>
                    <td style={styles.td}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: log.event === 'sent' ? '#dbeafe' : log.event === 'delivered' ? '#dcfce7' : log.event === 'clicked' ? '#dbeafe' : '#fee2e2'
                      }}>
                        {log.event}
                      </span>
                    </td>
                    <td style={styles.td}>{log.message || log.title || "-"}</td>
                    <td style={styles.td, { fontFamily: "monospace", fontSize: "11px" }}>{log.id ? log.id.substring(0, 20) + "..." : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px", fontSize: "12px", color: "#6b7280" }}>
        <p>✅ Push Notification Monitoring System | Auto-refreshes every 5 seconds</p>
      </div>
    </div>
  );
}
