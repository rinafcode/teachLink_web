'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, MapPin, Plus, Trash2, ExternalLink, Users, Mic } from 'lucide-react';

export interface AccessibilityConference {
  id: string;
  title: string;
  focus: string;
  date: string;
  location: string;
  url?: string;
  virtual: boolean;
}

const SAMPLE_CONFERENCES: AccessibilityConference[] = [
  {
    id: 'csun-2025',
    title: 'CSUN Assistive Technology Conference',
    focus: 'Assistive technology across disabilities',
    date: '2025-03-03',
    location: 'Anaheim, CA',
    url: 'https://www.csun.edu/cod/conference',
    virtual: false,
  },
  {
    id: 'axe-con-2025',
    title: 'axe-con',
    focus: 'Digital accessibility — web, design, documents',
    date: '2025-03-26',
    location: 'Online',
    url: 'https://www.deque.com/axe-con',
    virtual: true,
  },
  {
    id: 'a11ynyc-2025',
    title: 'Accessibility NYC Unconference',
    focus: 'Community-driven a11y topics',
    date: '2025-06-14',
    location: 'New York, NY',
    virtual: false,
  },
];

const STORAGE_KEY = 'a11y:conferences';

function readSaved(): AccessibilityConference[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AccessibilityConference[]) : [];
  } catch {
    return [];
  }
}

function saveConferences(items: AccessibilityConference[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * AccessibilityConferenceManagement – lets users browse recommended accessibility
 * conferences and manage their own list of conferences attended/planned.
 * Tied into the Accessibility Features section of the platform.
 */
export function AccessibilityConferenceManagement() {
  const [saved, setSaved] = useState<AccessibilityConference[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    focus: '',
    date: '',
    location: '',
    url: '',
    virtual: false,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(readSaved());
  }, []);

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.title.trim() || !form.date || !form.location.trim()) {
        setFormError('Title, date, and location are required.');
        return;
      }
      setFormError(null);
      const next: AccessibilityConference = {
        id: `user_${Date.now()}`,
        title: form.title.trim(),
        focus: form.focus.trim(),
        date: form.date,
        location: form.location.trim(),
        url: form.url.trim() || undefined,
        virtual: form.virtual,
      };
      const updated = [next, ...saved];
      setSaved(updated);
      saveConferences(updated);
      setForm({ title: '', focus: '', date: '', location: '', url: '', virtual: false });
      setShowForm(false);
    },
    [form, saved],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const updated = saved.filter((c) => c.id !== id);
      setSaved(updated);
      saveConferences(updated);
    },
    [saved],
  );

  const renderCard = (conf: AccessibilityConference, removable = false) => (
    <li
      key={conf.id}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {conf.virtual ? (
            <Mic className="w-4 h-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
          ) : (
            <Users className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
          )}
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">{conf.title}</h4>
        </div>
        {removable && (
          <button
            onClick={() => handleRemove(conf.id)}
            aria-label={`Remove ${conf.title}`}
            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {conf.focus && <p className="text-xs text-gray-500 dark:text-gray-400">{conf.focus}</p>}
      <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" aria-hidden="true" />
          {formatDate(conf.date)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" aria-hidden="true" />
          {conf.location}
        </span>
        {conf.virtual && (
          <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full">
            Virtual
          </span>
        )}
        {conf.url && (
          <a
            href={conf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            Website
          </a>
        )}
      </div>
    </li>
  );

  return (
    <section aria-labelledby="a11y-conf-heading" className="space-y-6">
      <h3 id="a11y-conf-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
        Accessibility Conferences
      </h3>

      {/* Recommended */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Recommended Conferences
        </h4>
        <ul className="space-y-3" aria-label="Recommended accessibility conferences">
          {SAMPLE_CONFERENCES.map((c) => renderCard(c, false))}
        </ul>
      </div>

      {/* User's list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">My Conferences</h4>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            aria-expanded={showForm}
          >
            <Plus className="w-3 h-3" aria-hidden="true" />
            {showForm ? 'Cancel' : 'Add Conference'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3 mb-4"
            aria-label="Add accessibility conference"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Conference title *"
                required
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Conference title"
              />
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Conference date"
              />
            </div>
            <input
              type="text"
              value={form.focus}
              onChange={(e) => setForm((f) => ({ ...f, focus: e.target.value }))}
              placeholder="Accessibility focus (optional)"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Accessibility focus"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Location *"
                required
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Location"
              />
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="Website URL (optional)"
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Conference website"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.virtual}
                onChange={(e) => setForm((f) => ({ ...f, virtual: e.target.checked }))}
                className="h-4 w-4 accent-blue-600"
              />
              Virtual / Online conference
            </label>
            {formError && (
              <p className="text-xs text-red-600 dark:text-red-400" role="alert">
                {formError}
              </p>
            )}
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Save Conference
            </button>
          </form>
        )}

        {saved.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No conferences added yet.</p>
        ) : (
          <ul className="space-y-3" aria-label="My accessibility conferences">
            {saved.map((c) => renderCard(c, true))}
          </ul>
        )}
      </div>
    </section>
  );
}
