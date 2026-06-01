import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import { UpdateTicketInputSchema } from '@/lib/tickets/types';
import { assessRisk } from '@/lib/tickets/risk-engine';
import { ticketDb } from '../route';

export const runtime = 'edge';

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/v1/tickets/:id */
export async function GET(req: NextRequest, { params }: RouteContext) {
  edgeLog('info', '/api/v1/tickets/[id]', 'GET request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const ticket = ticketDb.get(id);
  if (!ticket) {
    return addHeaders(NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 }));
  }

  return addHeaders(NextResponse.json({ success: true, data: ticket }));
}

/** PATCH /api/v1/tickets/:id — update status, priority, or assignee */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  edgeLog('info', '/api/v1/tickets/[id]', 'PATCH request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  const ticket = ticketDb.get(id);
  if (!ticket) {
    return addHeaders(NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 }));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return addHeaders(NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 }));
  }

  const parsed = UpdateTicketInputSchema.safeParse(body);
  if (!parsed.success) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 422 },
      ),
    );
  }

  const updated = { ...ticket, ...parsed.data, updatedAt: Date.now() };

  // Re-assess risk if priority changed
  if (parsed.data.priority && parsed.data.priority !== ticket.priority) {
    updated.risk = assessRisk(
      updated.priority,
      updated.category,
      updated.title,
      updated.description,
    );
  }

  ticketDb.set(id, updated);
  return addHeaders(NextResponse.json({ success: true, data: updated }));
}

/** DELETE /api/v1/tickets/:id */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  edgeLog('info', '/api/v1/tickets/[id]', 'DELETE request received');
  const { addHeaders, rateLimitResponse } = withRateLimit(req, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const { id } = await params;
  if (!ticketDb.has(id)) {
    return addHeaders(NextResponse.json({ success: false, message: 'Ticket not found' }, { status: 404 }));
  }

  ticketDb.delete(id);
  return addHeaders(NextResponse.json({ success: true, message: 'Ticket deleted' }));
}
