'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { PermissionGate } from '@/app/components/auth/PermissionGate';
import { Permission, User } from '@/types/api';
import type { ApprovalItem, ApprovalStatus } from '@/types/api';

interface ApprovalQueueProps {
  user: User | null | undefined;
}

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: ApprovalStatus | 'ALL' }> = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: 'ALL' },
];

function StatusBadge({ status }: { status: ApprovalStatus }) {
  const styles: Record<ApprovalStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  const icons: Record<ApprovalStatus, React.ReactNode> = {
    PENDING: <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle className="w-3 h-3" />,
    REJECTED: <XCircle className="w-3 h-3" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

export function ApprovalQueue({ user }: ApprovalQueueProps) {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<ApprovalStatus | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await fetch(`/api/approvals${params}`);
      const json = await res.json();
      if (json.success) setItems(json.data);
      else setError(json.message ?? 'Failed to load approvals');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!user) return;
    setSubmitting(id);
    setError(null);
    try {
      const res = await fetch('/api/approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          reviewedBy: user.id,
          reviewNote: reviewNote[id] ?? '',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.map((item) => (item.id === id ? json.data : item)));
      } else {
        setError(json.message ?? 'Review failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <PermissionGate
      user={user}
      permission={Permission.CONTENT_APPROVE}
      fallback={
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You do not have permission to view the approval queue.
        </p>
      }
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Approval Queue</h2>
          <button
            onClick={fetchItems}
            disabled={loading}
            aria-label="Refresh approval queue"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter approvals by status">
          {STATUS_FILTER_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {/* List */}
        {loading && items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No submissions found.</p>
        ) : (
          <ul className="space-y-3" aria-label="Approval submissions">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.contentType} · submitted by{' '}
                      <span className="font-medium">{item.submittedBy}</span> ·{' '}
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                {item.status === 'PENDING' && (
                  <div className="space-y-2">
                    <textarea
                      value={reviewNote[item.id] ?? ''}
                      onChange={(e) =>
                        setReviewNote((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Optional review note…"
                      rows={2}
                      maxLength={500}
                      className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => review(item.id, 'APPROVED')}
                        disabled={submitting === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve It
                      </button>
                      <button
                        onClick={() => review(item.id, 'REJECTED')}
                        disabled={submitting === item.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {item.reviewNote && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Note: {item.reviewNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PermissionGate>
  );
}
