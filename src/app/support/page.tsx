'use client';

import { useState } from 'react';
import { TicketForm } from '@/components/tickets/TicketForm';
import { TicketList } from '@/components/tickets/TicketList';
import { useStore } from '@/store/stateManager';

export default function SupportPage() {
  const userId = useStore((s) => s.user.id) ?? 'anonymous';
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Support</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit a ticket and our team will respond based on risk priority.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {showForm ? 'Cancel' : 'New Ticket'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">
            New Support Ticket
          </h2>
          <TicketForm
            submittedBy={userId}
            onSuccess={() => setShowForm(false)}
          />
        </div>
      )}

      <TicketList />
    </main>
  );
}
