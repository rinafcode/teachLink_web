'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Flag,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  History,
  X,
  Save,
  AlertTriangle,
  Search,
  Tag,
  Percent,
  Users,
  Globe,
  Check,
} from 'lucide-react';
import type { FeatureFlag, TargetingRule, RolloutStrategy, AuditEntry } from '@/lib/feature-flags';
import { useAllFeatureFlags } from '@/hooks/useFeatureFlag';

// ─── Small shared UI ──────────────────────────────────────────────────────────

function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'red' | 'yellow' | 'blue';
}) {
  const colors = {
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[variant]}`}
    >
      {children}
    </span>
  );
}

function StrategyIcon({ strategy }: { strategy: RolloutStrategy }) {
  if (strategy === 'percentage') return <Percent className="w-3.5 h-3.5" />;
  if (strategy === 'targeting') return <Users className="w-3.5 h-3.5" />;
  return <Globe className="w-3.5 h-3.5" />;
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40 ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Flag form modal ──────────────────────────────────────────────────────────

interface FlagFormProps {
  initial: Partial<FeatureFlag> | null;
  onSave: (data: Partial<FeatureFlag>) => Promise<void>;
  onClose: () => void;
}

const EMPTY_RULE: TargetingRule = { attribute: '', operator: 'equals', value: '' };

function FlagForm({ initial, onSave, onClose }: FlagFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [strategy, setStrategy] = useState<RolloutStrategy>(initial?.strategy ?? 'all');
  const [percentage, setPercentage] = useState(initial?.percentage ?? 0);
  const [rules, setRules] = useState<TargetingRule[]>(initial?.rules ?? []);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRule = () => setRules((r) => [...r, { ...EMPTY_RULE }]);
  const removeRule = (i: number) => setRules((r) => r.filter((_, idx) => idx !== i));
  const updateRule = (i: number, patch: Partial<TargetingRule>) =>
    setRules((r) => r.map((rule, idx) => (idx === i ? { ...rule, ...patch } : rule)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        strategy,
        percentage: Number(percentage),
        rules: strategy === 'targeting' ? rules.filter((r) => r.attribute && r.value) : [],
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(String(err));
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {initial?.id ? 'Edit Feature Flag' : 'New Feature Flag'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Dashboard"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this flag control?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags <span className="text-xs text-gray-400">(comma separated)</span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ui, beta, experiment"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rollout Strategy
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'percentage', 'targeting'] as RolloutStrategy[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrategy(s)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-medium transition-colors ${
                    strategy === s
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <StrategyIcon strategy={s} />
                  <span className="capitalize">{s === 'all' ? 'Everyone' : s}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Percentage slider */}
          {strategy === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Percentage rollout: <span className="font-bold text-blue-600">{percentage}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Targeting rules */}
          {strategy === 'targeting' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Targeting Rules <span className="text-xs text-gray-400">(all must match)</span>
                </label>
                <button
                  type="button"
                  onClick={addRule}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add rule
                </button>
              </div>
              {rules.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  No rules — flag will never match. Add at least one rule.
                </p>
              )}
              {rules.map((rule, i) => (
                <div key={i} className="flex gap-2 items-center mb-2">
                  <input
                    value={rule.attribute}
                    onChange={(e) => updateRule(i, { attribute: e.target.value })}
                    placeholder="attribute"
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(i, { operator: e.target.value as TargetingRule['operator'] })
                    }
                    className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="equals">equals</option>
                    <option value="contains">contains</option>
                    <option value="startsWith">starts with</option>
                    <option value="in">in (csv)</option>
                  </select>
                  <input
                    value={rule.value}
                    onChange={(e) => updateRule(i, { value: e.target.value })}
                    placeholder="value"
                    className="flex-1 px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(i)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Audit log panel ──────────────────────────────────────────────────────────

function AuditPanel({ flagId, onClose }: { flagId?: string; onClose: () => void }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (flagId) params.set('flagId', flagId);
    const res = await fetch(`/api/admin/feature-flags/audit?${params}`);
    const data = (await res.json()) as { entries: AuditEntry[]; total: number };
    setEntries(data.entries);
    setTotal(data.total);
    setLoading(false);
  }, [flagId]);

  useState(() => {
    void load();
  });

  const ACTION_COLORS: Record<AuditEntry['action'], string> = {
    created: 'green',
    updated: 'blue',
    toggled: 'yellow',
    deleted: 'red',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-500" />
              Audit Log
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{total} total entries</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>}
          {!loading && entries.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No audit entries yet.</div>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
            >
              <Badge variant={ACTION_COLORS[entry.action] as 'green' | 'red' | 'yellow' | 'blue'}>
                {entry.action}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {entry.flagName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  by <span className="font-medium">{entry.actor}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Flag row ─────────────────────────────────────────────────────────────────

function FlagRow({
  flag,
  onEdit,
  onToggle,
  onDelete,
  onAudit,
}: {
  flag: FeatureFlag;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onAudit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    setToggling(false);
  };

  const strategyLabel: Record<RolloutStrategy, string> = {
    all: 'Everyone',
    percentage: `${flag.percentage}% of users`,
    targeting: `${flag.rules.length} rule${flag.rules.length !== 1 ? 's' : ''}`,
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        flag.enabled
          ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Expand chevron */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Toggle */}
        <Toggle checked={flag.enabled} onChange={handleToggle} disabled={toggling} />

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-white text-sm">{flag.name}</span>
            <Badge variant={flag.enabled ? 'green' : 'default'}>
              {flag.enabled ? <Check className="w-3 h-3" /> : null}
              {flag.enabled ? 'On' : 'Off'}
            </Badge>
            <Badge>
              <StrategyIcon strategy={flag.strategy} />
              {strategyLabel[flag.strategy]}
            </Badge>
            {flag.tags.map((tag) => (
              <Badge key={tag} variant="blue">
                <Tag className="w-3 h-3" />
                {tag}
              </Badge>
            ))}
          </div>
          {flag.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {flag.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onAudit}
            title="View audit log"
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t dark:border-gray-700 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="font-medium">ID:</span>{' '}
              <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{flag.id}</code>
            </div>
            <div>
              <span className="font-medium">Created by:</span> {flag.createdBy}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(flag.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{' '}
              {new Date(flag.updatedAt).toLocaleString()}
            </div>
          </div>

          {flag.strategy === 'targeting' && flag.rules.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Targeting Rules
              </p>
              <div className="space-y-1">
                {flag.rules.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg"
                  >
                    <code className="text-blue-600 dark:text-blue-400">{rule.attribute}</code>
                    <span className="text-gray-400">{rule.operator}</span>
                    <code className="text-green-600 dark:text-green-400">{rule.value}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FeatureFlagsPage() {
  const { flags, isLoading, error, reload } = useAllFeatureFlags();

  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'on' | 'off'>('all');

  const [editingFlag, setEditingFlag] = useState<Partial<FeatureFlag> | null | false>(false);
  const [auditFlagId, setAuditFlagId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // All unique tags for filter chips
  const allTags = [...new Set(flags.flatMap((f) => f.tags))].sort();

  const filtered = flags.filter((f) => {
    if (
      search &&
      !f.name.toLowerCase().includes(search.toLowerCase()) &&
      !f.description.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (filterTag && !f.tags.includes(filterTag)) return false;
    if (filterEnabled === 'on' && !f.enabled) return false;
    if (filterEnabled === 'off' && f.enabled) return false;
    return true;
  });

  const doToggle = async (flag: FeatureFlag) => {
    setActionError(null);
    const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-user': 'admin' },
      body: JSON.stringify({ enabled: !flag.enabled }),
    });
    if (!res.ok) {
      setActionError(`Toggle failed: HTTP ${res.status}`);
      return;
    }
    await reload();
  };

  const doDelete = async (id: string) => {
    setActionError(null);
    const res = await fetch(`/api/admin/feature-flags/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-user': 'admin' },
    });
    if (!res.ok) {
      setActionError(`Delete failed: HTTP ${res.status}`);
      return;
    }
    setDeleteConfirmId(null);
    await reload();
  };

  const doSave = async (data: Partial<FeatureFlag>) => {
    const isNew = !editingFlag || !('id' in editingFlag);
    const url = isNew
      ? '/api/admin/feature-flags'
      : `/api/admin/feature-flags/${(editingFlag as FeatureFlag).id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'x-admin-user': 'admin' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setEditingFlag(false);
    await reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Flag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Feature Flags</h1>
            <Badge variant="blue">{flags.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowAudit(true);
                setAuditFlagId(null);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
            </button>
            <button
              onClick={() => setEditingFlag({})}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Flag</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Error banner */}
        {(error || actionError) && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl p-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error ?? actionError}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flags…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Enabled filter */}
          <div className="flex rounded-xl border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
            {(['all', 'on', 'off'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilterEnabled(v)}
                className={`px-3 py-2 capitalize transition-colors ${
                  filterEnabled === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {v === 'all' ? 'All' : v === 'on' ? '✓ On' : '✗ Off'}
              </button>
            ))}
          </div>
        </div>

        {/* Tag chips */}
        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterTag === tag
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 bg-white dark:bg-gray-800'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Total',
              value: flags.length,
              icon: <Flag className="w-4 h-4 text-gray-500" />,
            },
            {
              label: 'Enabled',
              value: flags.filter((f) => f.enabled).length,
              icon: <ToggleRight className="w-4 h-4 text-green-500" />,
            },
            {
              label: 'Disabled',
              value: flags.filter((f) => !f.enabled).length,
              icon: <ToggleLeft className="w-4 h-4 text-gray-400" />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-3"
            >
              {icon}
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Flags list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Flag className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {flags.length === 0
                ? 'No flags yet. Create your first one.'
                : 'No flags match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((flag) => (
              <FlagRow
                key={flag.id}
                flag={flag}
                onEdit={() => setEditingFlag(flag)}
                onToggle={() => doToggle(flag)}
                onDelete={() => setDeleteConfirmId(flag.id)}
                onAudit={() => {
                  setAuditFlagId(flag.id);
                  setShowAudit(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {editingFlag !== false && (
        <FlagForm initial={editingFlag} onSave={doSave} onClose={() => setEditingFlag(false)} />
      )}

      {showAudit && (
        <AuditPanel
          flagId={auditFlagId ?? undefined}
          onClose={() => {
            setShowAudit(false);
            setAuditFlagId(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Delete flag?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
