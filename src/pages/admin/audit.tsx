import { useEffect, useMemo, useState } from 'react';
import type { AuditAction, AuditLogEntry } from '@/lib/audit';
import AdminThemeToggle from '@/components/admin/AdminThemeToggle';

type AuditApiResponse = {
  entries: AuditLogEntry[];
  total: number;
};

function formatTime(value: string): string {
  return new Date(value).toLocaleString();
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<AuditAction | ''>('');
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (action) params.set('action', action);
      params.set('limit', '100');

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Unable to load audit logs: ${response.status}`);
      }

      const data = (await response.json()) as AuditApiResponse;
      setEntries(data.entries);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
      setEntries([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const summary = useMemo(() => {
    const counts: Record<AuditAction, number> = {
      create: 0,
      update: 0,
      delete: 0,
    };

    entries.forEach((entry) => {
      counts[entry.action] += 1;
    });

    return counts;
  }, [entries]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Audit Trail</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Search and review create, update, and delete activity across tracked resources.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdminThemeToggle />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">
              <span className="text-xs uppercase tracking-widest font-semibold">Create</span>
              <p className="text-xl font-bold mt-1">{summary.create}</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/30">
              <span className="text-xs uppercase tracking-widest font-semibold">Update</span>
              <p className="text-xl font-bold mt-1">{summary.update}</p>
            </div>
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-3 text-rose-800 dark:text-rose-350 border border-rose-100 dark:border-rose-900/30">
              <span className="text-xs uppercase tracking-widest font-semibold">Delete</span>
              <p className="text-xl font-bold mt-1">{summary.delete}</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by actor, resource, ID, or metadata"
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 text-sm outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
            />
            <select
              value={action}
              onChange={(event) => setAction(event.target.value as AuditAction | '')}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 text-sm outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
            >
              <option value="">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
            <button
              type="button"
              onClick={() => void fetchAuditLogs()}
              className="rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-850 dark:hover:bg-slate-700 px-5 py-2 text-sm font-medium text-white transition-all shadow-sm border border-slate-900 dark:border-slate-700"
            >
              Filter
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
            {loading ? 'Loading audit events...' : `Showing ${entries.length} of ${total} events`}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase tracking-wide text-slate-550 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Time</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Path</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {entry.actorId}
                    </td>
                    <td className="px-4 py-3.5 capitalize text-slate-750 dark:text-slate-300">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          entry.action === 'create'
                            ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/20'
                            : entry.action === 'update'
                            ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/20'
                            : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/20'
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-750 dark:text-slate-300">
                      <div className="font-medium">{entry.targetType}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.targetId}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-650 dark:text-slate-400 font-mono">
                      {entry.path}
                    </td>
                    <td className="px-4 py-3.5 text-slate-750 dark:text-slate-300">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          entry.statusCode >= 200 && entry.statusCode < 300
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/20'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border border-rose-200 dark:border-rose-900/20'
                        }`}
                      >
                        {entry.statusCode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
