import React from 'react';
import { useMetrics } from '@/lib/monitoring/metrics';
import { checkAlerts } from '@/lib/monitoring/alerts';
import AdminThemeToggle from '@/components/admin/AdminThemeToggle';
import { Activity, AlertOctagon } from 'lucide-react';

const MonitoringDashboard: React.FC = () => {
  const metrics = useMetrics();
  const alerts = checkAlerts(metrics);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Performance Monitoring
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time system health and analytics status.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminThemeToggle />
          </div>
        </header>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2.5">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/30 rounded-2xl shadow-sm"
              >
                <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">System Alert Triggered</h4>
                  <p className="text-xs text-red-700 dark:text-red-400/90 mt-0.5">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-455 dark:text-slate-500">
                  {metric.name}
                </p>
                <p className="text-3xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-white">
                  {metric.value.toFixed(2)}
                </p>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    metric.value > 80
                      ? 'bg-red-500'
                      : metric.value > 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
