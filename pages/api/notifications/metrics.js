// pages/api/notifications/metrics.js
export default function handler(req, res) {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system
    },
    notifications: {
      totalSent: global.totalSent || 0,
      totalDelivered: global.totalDelivered || 0,
      totalFailed: global.totalFailed || 0
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };
  
  res.status(200).json(metrics);
}
