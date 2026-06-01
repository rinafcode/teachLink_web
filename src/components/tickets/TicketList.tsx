'use client';

import { useEffect } from 'react';
import { useTicketStore, fetchTickets } from '@/lib/tickets/store';
import { RiskBadge } from './RiskBadge';
import type { Ticket } from '@/lib/tickets/types';

const STATUS_STYLES: Record<Ticket['status'], string> = {
  open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function TicketList() {
  const tickets = useTicketStore((s) => s.tickets);
  const loading = useTicketStore((s) => s.loading);
  const setTickets = useTicketStore((s) => s.setTickets);
  const setLoading = useTicketStore((s) => s.setLoading);

  useEffect(() => {
    setLoading(true);
    fetchTickets()
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [setTickets, setLoading]);

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading tickets…</p>;
  }

  if (tickets.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No tickets yet.</p>;
  }

  return (
    <ul className="space-y-3" aria-label="Support tickets">
      {tickets.map((ticket) => (
        <li
          key={ticket.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {ticket.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 capitalize">
                {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <RiskBadge level={ticket.risk.level} score={ticket.risk.score} showScore />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Risk factors — visible for high/critical */}
          {(ticket.risk.level === 'high' || ticket.risk.level === 'critical') && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Risk factors
              </summary>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
                {ticket.risk.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
