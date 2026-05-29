'use client';

/**
 * @module tickets/store
 * Zustand store for support tickets (client-side cache + optimistic updates).
 */
import { create } from 'zustand';
import type { Ticket, CreateTicketInput, UpdateTicketInput } from './types';

interface TicketStoreActions {
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  removeTicket: (id: string) => void;
}

interface TicketSlice extends TicketStoreActions {
  tickets: Ticket[];
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useTicketStore = create<TicketSlice>()((set) => ({
  tickets: [],
  loading: false,

  setLoading: (v) => set({ loading: v }),
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) => set((s) => ({ tickets: [ticket, ...s.tickets] })),
  updateTicket: (id, patch) =>
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
  removeTicket: (id) => set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) })),
}));

// ─── API helpers ──────────────────────────────────────────────────────────────

const BASE = '/api/v1/tickets';

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch(BASE);
  if (!res.ok) return [];
  const json = (await res.json()) as { data: Ticket[] };
  return json.data ?? [];
}

export async function createTicket(input: CreateTicketInput): Promise<Ticket | null> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Ticket };
  return json.data ?? null;
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
): Promise<Ticket | null> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: Ticket };
  return json.data ?? null;
}
