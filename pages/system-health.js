import { useEffect, useState } from "react";

export default function SystemHealthDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [metrics, setMetrics] = useState({ sent: 0, delivered: 0, clicked: 0, failed: 0 });
  const [logs, setLogs] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    memory: { heapUsed: 0, heapTotal: 0, rss: 0 },
    cpu: { user: 0, system: 0 },
    uptime: 0,
    platform: '',
    nodeVersion: ''
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [logFilter, setLogFilter] = useState("all");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchAllData = async () => {
    try {
      const trackRes = await fetch("/api/notifications/track");
      const trackData = await trackRes.json();
      setMetrics(trackData.metrics || { sent: 0, delivered: 0, clicked: 0, failed: 0 });
      setLogs(trackData.logs || []);
      
      const metricsRes = await fetch("/api/notifications/metrics");
      const metricsData = await metricsRes.json();
      setSystemMetrics({
        memory: {
          heapUsed: (metricsData.memory.heapUsed / 1024 / 1024).toFixed(2),
          heapTotal: (metricsData.memory.heapTotal / 1024 / 1024).toFixed(2),
          rss: (metricsData.memory.rss / 1024 / 1024).toFixed(2)
        },
        cpu: {
          user: (metricsData.cpu.user / 1000000).toFixed(2),
          system: (metricsData.cpu.system / 1000000).toFixed(2)
        },
        uptime: metricsData.uptime,
        platform: metricsData.system.platform,
        nodeVersion: metricsData.system.nodeVersion
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Fetch error:", error);
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
        setMessage("");
        fetchAllData();
        alert("✅ Notification sent successfully!");
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send notification");
    }
    setLoading(false);
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = async () => {
    if (confirm("Clear all notification logs?")) {
      await fetch("/api/notifications/track", { method: "DELETE" });
      fetchAllData();
      alert("Logs cleared successfully!");
    }
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === "all") return true;
    return log.event === logFilter;
  });

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getMemoryColor = () => {
    const usage = parseFloat(systemMetrics.memory.heapUsed);
    if (usage > 200) return "#ef4444";
    if (usage > 100) return "#f59e0b";
    return "#10b981";
  };

  const getEventStyle = (event) => {
    switch(event) {
      case 'sent': return { background: '#dbeafe', color: '#1e40af' };
      case 'delivered': return { background: '#dcfce7', color: '#166534' };
      case 'clicked': return { background: '#dbeafe', color: '#1e40af' };
      case 'failed': return { background: '#fee2e2', color: '#991b1b' };
      default: return { background: '#e5e7eb', color: '#374151' };
    }
  };

  const displayLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 15);

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1400px",
      margin: "0 auto",
      background: darkMode ? "#0a0a0a" : "#f5f5f5",
      color: darkMode ? "#ffffff" : "#000000",
      minHeight: "100vh",
      fontFamily: "Arial, sans-serif"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "10px"
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      margin: 0
    },
    darkButton: {
      padding: "10px 20px",
      background: darkMode ? "#444" : "#ddd",
      color: darkMode ? "#fff" : "#000",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer"
    },
    section: {
      background: darkMode ? "#1a1a2e" : "#ffffff",
      borderRadius: "12px",
      padding: "20px",
      marginBottom: "20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    },
    sectionTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      margin: "0 0 15px 0",
      borderBottom: `2px solid ${darkMode ? "#333" : "#e0e0e0"}`,
      paddingBottom: "10px"
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
      marginBottom: "20px"
    },
    metricCard: {
      background: darkMode ? "#16213e" : "#f8f9fa",
      borderRadius: "10px",
      padding: "15px",
      textAlign: "center"
    },
    metricValue: {
      fontSize: "32px",
      fontWeight: "bold",
      margin: "10px 0"
    },
    metricLabel: {
      fontSize: "14px",
      color: darkMode ? "#aaa" : "#666"
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "15px",
      marginBottom: "20px"
    },
    notificationCard: {
      padding: "15px",
      borderRadius: "8px",
      textAlign: "center"
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "10px",
      borderRadius: "8px",
      border: `1px solid ${darkMode ? "#333" : "#ddd"}`,
      background: darkMode ? "#2a2a2e" : "#fff",
      color: darkMode ? "#fff" : "#000",
      fontSize: "14px"
    },
    button: {
      padding: "10px 20px",
      background: "#8b5cf6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px"
    },
    buttonSmall: {
      padding: "6px 12px",
      background: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px"
    },
    dangerButton: {
      padding: "6px 12px",
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px"
    },
    viewLogsButton: {
      padding: "10px 20px",
      background: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "13px"
    },
    th: {
      padding: "12px",
      textAlign: "left",
      background: darkMode ? "#0f3460" : "#f0f0f0",
      borderBottom: `1px solid ${darkMode ? "#333" : "#ddd"}`
    },
    td: {
      padding: "10px",
      borderBottom: `1px solid ${darkMode ? "#222" : "#eee"}`
    },
    badge: {
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "bold"
    },
    statusBadge: {
      display: "inline-block",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      marginRight: "8px",
      background: "#10b981",
      animation: "pulse 2s infinite"
    },
    refreshText: {
      fontSize: "11px",
      color: darkMode ? "#888" : "#999",
      marginTop: "10px",
      textAlign: "center"
    },
    progressBar: {
      height: "8px",
      background: "#e0e0e0",
      borderRadius: "4px",
      marginTop: "10px",
      overflow: "hidden"
    },
    progressFill: {
      width: `${metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0}%`,
      height: "100%",
      background: "#10b981",
      transition: "width 0.3s"
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 1000,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    },
    modalContent: {
      background: darkMode ? "#1a1a2e" : "#ffffff",
      borderRadius: "12px",
      width: "90%",
      maxWidth: "1200px",
      maxHeight: "80vh",
      overflow: "auto",
      padding: "20px"
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px"
    },
    closeButton: {
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "8px 16px",
      cursor: "pointer"
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div style={styles.container} suppressHydrationWarning>
      <div style={styles.header}>
        <h1 style={styles.title}>🔍 System Health & Monitoring Dashboard</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowLogsModal(true)} style={styles.viewLogsButton}>
            📋 View All Logs ({logs.length})
          </button>
          <button onClick={() => setDarkMode(!darkMode)} style={styles.darkButton}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>

      {/* System Health Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🖥️ System Health</h2>
        <div style={styles.grid3}>
          <div style={styles.metricCard}>
            <div>💾 Memory Usage</div>
            <div style={{ ...styles.metricValue, color: getMemoryColor() }}>
              {systemMetrics.memory.heapUsed} MB
            </div>
            <div style={styles.metricLabel}>
              Heap Total: {systemMetrics.memory.heapTotal} MB | RSS: {systemMetrics.memory.rss} MB
            </div>
            <div style={{ marginTop: "10px", fontSize: "12px" }}>
              <span>📊 Memory Pressure: </span>
              <span style={{ color: getMemoryColor() }}>
                {systemMetrics.memory.heapTotal > 0 ? 
                  ((systemMetrics.memory.heapUsed / systemMetrics.memory.heapTotal) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
          
          <div style={styles.metricCard}>
            <div>⚙️ CPU Usage</div>
            <div style={styles.metricValue}>
              {systemMetrics.cpu.user} sec
            </div>
            <div style={styles.metricLabel}>
              System: {systemMetrics.cpu.system} sec
            </div>
            <div style={{ marginTop: "10px", fontSize: "12px" }}>
              <span>🎯 Total CPU Time: </span>
              <span>{(parseFloat(systemMetrics.cpu.user) + parseFloat(systemMetrics.cpu.system)).toFixed(2)} sec</span>
            </div>
          </div>
          
          <div style={styles.metricCard}>
            <div>⏱️ System Uptime</div>
            <div style={styles.metricValue}>
              {formatUptime(systemMetrics.uptime)}
            </div>
            <div style={styles.metricLabel}>
              <span>🟢 Status: Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Metrics Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📨 Notification Metrics</h2>
        <div style={styles.metricsGrid}>
          <div style={{ ...styles.notificationCard, background: "#dbeafe" }}>
            <div>📤 Total Sent</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.sent}</div>
          </div>
          <div style={{ ...styles.notificationCard, background: "#dcfce7" }}>
            <div>📬 Delivered</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.delivered}</div>
          </div>
          <div style={{ ...styles.notificationCard, background: "#dbeafe" }}>
            <div>👆 Clicked</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.clicked}</div>
          </div>
          <div style={{ ...styles.notificationCard, background: "#fee2e2" }}>
            <div>❌ Failed</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>{metrics.failed}</div>
          </div>
        </div>
        
        {/* Delivery Rate */}
        <div style={{ padding: "15px", background: darkMode ? "#16213e" : "#f8f9fa", borderRadius: "8px" }}>
          <div>📊 Delivery Success Rate</div>
          <div style={{ fontSize: "24px", fontWeight: "bold", marginTop: "5px" }}>
            {metrics.sent > 0 ? ((metrics.delivered / metrics.sent) * 100).toFixed(1) : 0}%
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
        </div>
      </div>

      {/* Send Test Notification */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>✉️ Send Test Notification</h2>
        <input
          type="text"
          placeholder="Enter notification message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.input}
        />
        <button onClick={sendNotification} disabled={loading} style={styles.button}>
          {loading ? "Sending..." : "📤 Send Test Notification"}
        </button>
      </div>

      {/* Recent Events Preview */}
      <div style={styles.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0 }}>📋 Recent Events ({filteredLogs.length} events)</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <select 
              value={logFilter} 
              onChange={(e) => setLogFilter(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", border: `1px solid ${darkMode ? "#333" : "#ddd"}`, background: darkMode ? "#2a2a2e" : "#fff", color: darkMode ? "#fff" : "#000" }}
            >
              <option value="all">All Events</option>
              <option value="sent">📤 Sent Only</option>
              <option value="delivered">📬 Delivered Only</option>
              <option value="clicked">👆 Clicked Only</option>
              <option value="failed">❌ Failed Only</option>
            </select>
            <button onClick={() => setShowAllLogs(!showAllLogs)} style={styles.buttonSmall}>
              {showAllLogs ? "Show Less" : `Show All (${filteredLogs.length})`}
            </button>
            <button onClick={exportLogs} style={styles.buttonSmall}>📥 Export</button>
            <button onClick={clearLogs} style={styles.dangerButton}>🗑️ Clear</button>
          </div>
        </div>
        
        <div style={{ overflowX: "auto", maxHeight: "400px", overflowY: "auto" }}>
          <table style={styles.table}>
            <thead style={{ position: "sticky", top: 0 }}>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Event</th>
                <th style={styles.th}>Message</th>
                <th style={styles.th}>Notification ID</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "40px" }}>
                    No events yet. Send a test notification!
                  </td>
                </tr>
              ) : (
                displayLogs.map((log, index) => {
                  const eventStyle = getEventStyle(log.event);
                  return (
                    <tr key={index}>
                      <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...eventStyle }}>
                          {log.event === 'sent' ? '📤 Sent' : 
                           log.event === 'delivered' ? '📬 Delivered' : 
                           log.event === 'clicked' ? '👆 Clicked' : '❌ Failed'}
                        </span>
                      </td>
                      <td style={styles.td}>{log.message || log.title || "-"}</td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "11px" }}>
                        {log.id ? log.id.substring(0, 25) + "..." : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.refreshText}>
        <span style={styles.statusBadge}></span>
        Live Monitoring | Last updated: {lastUpdate.toLocaleTimeString()} | Auto-refresh every 5 seconds
      </div>

      {/* Full Logs Modal */}
      {showLogsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLogsModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>📋 Complete Event Logs ({logs.length} events)</h2>
              <button onClick={() => setShowLogsModal(false)} style={styles.closeButton}>
                Close ✕
              </button>
            </div>
            <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
              <table style={styles.table}>
                <thead style={{ position: "sticky", top: 0 }}>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Event</th>
                    <th style={styles.th}>Message</th>
                    <th style={styles.th}>Notification ID</th>
                    <th style={styles.th}>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                        No logs available
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, index) => {
                      const eventStyle = getEventStyle(log.event);
                      return (
                        <tr key={index}>
                          <td style={styles.td}>{index + 1}</td>
                          <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...eventStyle }}>
                              {log.event === 'sent' ? '📤 Sent' : 
                               log.event === 'delivered' ? '📬 Delivered' : 
                               log.event === 'clicked' ? '👆 Clicked' : '❌ Failed'}
                            </span>
                          </td>
                          <td style={styles.td}>{log.message || log.title || "-"}</td>
                          <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "11px" }}>{log.id || "-"}</td>
                          <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "11px" }}>{log.userId || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
