'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Globe, Plus, Shield, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { PermissionGate } from '@/app/components/auth/PermissionGate';
import { Permission, User } from '@/types/api';

export type PolicyAction = 'ALLOW' | 'DENY';
export type PolicyScope = 'IP' | 'CIDR' | 'COUNTRY';

export interface NetworkPolicy {
  id: string;
  scope: PolicyScope;
  value: string;
  action: PolicyAction;
  description?: string;
  createdAt: string;
}

interface NetworkPoliciesProps {
  user: User | null | undefined;
}

const SCOPE_LABELS: Record<PolicyScope, string> = {
  IP: 'IP Address',
  CIDR: 'CIDR Range',
  COUNTRY: 'Country Code',
};

function ActionBadge({ action }: { action: PolicyAction }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        action === 'ALLOW'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      }`}
    >
      <Shield className="w-3 h-3" aria-hidden="true" />
      {action}
    </span>
  );
}

const EMPTY_FORM = { scope: 'IP' as PolicyScope, value: '', action: 'ALLOW' as PolicyAction, description: '' };

/**
 * NetworkPolicies component for the Admin Panel.
 * Allows admins to define IP/CIDR/Country-level ALLOW or DENY rules.
 * Rules are persisted via the /api/admin/network-policies endpoint.
 */
export function NetworkPolicies({ user }: NetworkPoliciesProps) {
  const [policies, setPolicies] = useState<NetworkPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/network-policies');
      const json = await res.json();
      if (json.success) setPolicies(json.data);
      else setError(json.message ?? 'Failed to load network policies');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.value.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/network-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setPolicies((prev) => [json.data, ...prev]);
        setForm(EMPTY_FORM);
      } else {
        setError(json.message ?? 'Failed to add policy');
      }
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/network-policies?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) setPolicies((prev) => prev.filter((p) => p.id !== id));
      else setError(json.message ?? 'Failed to delete policy');
    } catch {
      setError('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PermissionGate
      user={user}
      permission={Permission.CONTENT_APPROVE}
      fallback={
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You do not have permission to manage network policies.
        </p>
      }
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Network Policies</h2>
          </div>
          <button
            onClick={fetchPolicies}
            disabled={loading}
            aria-label="Refresh network policies"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Add Policy Form */}
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 space-y-3"
          aria-label="Add network policy"
        >
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Policy</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={form.scope}
              onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as PolicyScope }))}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Policy scope"
            >
              {(Object.keys(SCOPE_LABELS) as PolicyScope[]).map((s) => (
                <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
              ))}
            </select>
            <input
              type="text"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              placeholder={form.scope === 'IP' ? '192.168.1.1' : form.scope === 'CIDR' ? '10.0.0.0/8' : 'US'}
              required
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Policy value"
            />
            <select
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value as PolicyAction }))}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Policy action"
            >
              <option value="ALLOW">Allow</option>
              <option value="DENY">Deny</option>
            </select>
          </div>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional description"
            maxLength={200}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Policy description"
          />
          <button
            type="submit"
            disabled={submitting || !form.value.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Policy
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Policy List */}
        {loading && policies.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : policies.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No network policies defined.</p>
        ) : (
          <ul className="space-y-2" aria-label="Network policy list">
            {policies.map((policy) => (
              <li
                key={policy.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ActionBadge action={policy.action} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">{SCOPE_LABELS[policy.scope]}</span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white truncate">{policy.value}</span>
                  {policy.description && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">{policy.description}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(policy.id)}
                  disabled={deletingId === policy.id}
                  aria-label={`Delete policy for ${policy.value}`}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PermissionGate>
  );
}
