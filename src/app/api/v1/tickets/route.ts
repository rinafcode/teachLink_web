import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { CreateTicketInputSchema, TicketSchema } from '@/lib/tickets/types';
import type { Ticket } from '@/lib/tickets/types';
import { assessRisk } from '@/lib/tickets/risk-engine';

export const runtime = 'edge';

/** Ephemeral in-memory store — replace with DB in production. */
export const ticketDb = new Map<string, Ticket>();

function generateId(): string {
  return `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** GET /api/v1/tickets — list all tickets, newest first */
export async function GET(req: NextRequest) {
  edgeLog('info', '/api/v1/tickets', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const tickets = Array.from(ticketDb.values()).sort((a, b) => b.createdAt - a.createdAt);
  return addHeaders(NextResponse.json({ success: true, data: tickets }));
}

/** POST /api/v1/tickets — create a ticket with automatic risk assessment */
export async function POST(req: NextRequest) {
  edgeLog('info', '/api/v1/tickets', 'POST request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return addHeaders(NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 }));
  }

  const parsed = CreateTicketInputSchema.safeParse(body);
  if (!parsed.success) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }

  const { title, description, category, priority, submittedBy } = parsed.data;
  const now = Date.now();

  const ticket: Ticket = {
    id: generateId(),
    title,
    description,
    category,
    priority,
    status: 'open',
    submittedBy,
    assignedTo: null,
    risk: assessRisk(priority, category, title, description),
    createdAt: now,
    updatedAt: now,
  };

  ticketDb.set(ticket.id, ticket);

  return addHeaders(NextResponse.json({ success: true, data: ticket }, { status: 201 }));
}
