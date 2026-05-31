'use client';

import { useState } from 'react';
import { useTicketStore, createTicket } from '@/lib/tickets/store';
import type { TicketCategory, TicketPriority } from '@/lib/tickets/types';

const CATEGORIES: TicketCategory[] = ['billing', 'technical', 'account', 'content', 'other'];
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

interface TicketFormProps {
  submittedBy: string;
  onSuccess?: () => void;
}

export function TicketForm({ submittedBy, onSuccess }: TicketFormProps) {
  const addTicket = useTicketStore((s) => s.addTicket);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const ticket = await createTicket({ title, description, category, priority, submittedBy });
    setSubmitting(false);

    if (!ticket) {
      setError('Failed to submit ticket. Please try again.');
      return;
    }

    addTicket(ticket);
    setTitle('');
    setDescription('');
    setCategory('technical');
    setPriority('medium');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Submit support ticket">
      <div>
        <label htmlFor="ticket-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          id="ticket-title"
          type="text"
          required
          minLength={5}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of the issue"
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div>
        <label htmlFor="ticket-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="ticket-description"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail..."
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ticket-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            id="ticket-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ticket-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Priority
          </label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">{p}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </form>
  );
}
