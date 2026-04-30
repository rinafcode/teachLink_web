import { useEffect, useMemo, useState } from 'react';
import type { AuditAction, AuditLogEntry } from '@/lib/audit';

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
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Audit Trail</h1>
          <p className="mt-2 text-sm text-slate-600">
            Search and review create, update, and delete activity across tracked resources.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-800">
              <span className="text-xs uppercase tracking-widest">Create</span>
              <p className="text-xl font-semibold">{summary.create}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-800">
              <span className="text-xs uppercase tracking-widest">Update</span>
              <p className="text-xl font-semibold">{summary.update}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-rose-800">
              <span className="text-xs uppercase tracking-widest">Delete</span>
              <p className="text-xl font-semibold">{summary.delete}</p>
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by actor, resource, ID, or metadata"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
            />
            <select
              value={action}
              onChange={(event) => setAction(event.target.value as AuditAction | '')}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
            <button
              type="button"
              onClick={() => void fetchAuditLogs()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Filter
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
            {loading ? 'Loading audit events...' : `Showing ${entries.length} of ${total} events`}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{entry.actorId}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{entry.action}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{entry.targetType}</div>
                      <div className="text-xs text-slate-500">{entry.targetId}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{entry.path}</td>
                    <td className="px-4 py-3 text-slate-700">{entry.statusCode}</td>
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
