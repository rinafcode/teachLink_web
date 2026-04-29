import React from "react";
import { useMetrics } from "@/lib/monitoring/metrics";
import { checkAlerts } from "@/lib/monitoring/alerts";

const MonitoringDashboard: React.FC = () => {
  const metrics = useMetrics();
  const alerts = checkAlerts(metrics);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Performance Monitoring Dashboard
      </h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="p-3 bg-red-100 text-red-700 rounded"
            >
              🚨 {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="p-4 border rounded shadow-sm"
          >
            <p className="text-sm text-gray-500">{metric.name}</p>
            <p className="text-lg font-bold">
              {metric.value.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonitoringDashboard;