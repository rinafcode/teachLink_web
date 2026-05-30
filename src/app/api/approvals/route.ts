import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { validateBody, validateQuery } from '@/lib/validation';
import type { ApprovalItem } from '@/types/api';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// In-memory store (replace with DB in production)
// ---------------------------------------------------------------------------

const approvalsStore = new Map<string, ApprovalItem>();

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const SubmitSchema = z.object({
  contentId: z.string().min(1),
  contentType: z.enum(['COURSE', 'POST']),
  title: z.string().min(1).max(200),
  submittedBy: z.string().min(1),
});

const ReviewSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewedBy: z.string().min(1),
  reviewNote: z.string().max(500).optional(),
});

const ListQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/approvals — list submissions (admin: all; others: filtered by submittedBy)
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(ListQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error);

  let items = Array.from(approvalsStore.values());
  if (result.data.status) {
    items = items.filter((item) => item.status === result.data.status);
  }

  return addHeaders(NextResponse.json({ success: true, data: items }));
}

// ---------------------------------------------------------------------------
// POST /api/approvals — submit content for approval (non-admin / RunAsNonRoot)
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const result = validateBody(SubmitSchema, await request.json());
  if (!result.ok) return addHeaders(result.error);

  const item: ApprovalItem = {
    id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    contentId: result.data.contentId,
    contentType: result.data.contentType,
    title: result.data.title,
    submittedBy: result.data.submittedBy,
    submittedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  approvalsStore.set(item.id, item);

  const response = addHeaders(NextResponse.json({ success: true, data: item }, { status: 201 }));
  logAuditMutation(request, {
    action: 'create',
    targetType: 'approval',
    targetId: item.id,
    statusCode: response.status,
    metadata: { contentId: item.contentId, contentType: item.contentType },
  });

  return response;
}

// ---------------------------------------------------------------------------
// PATCH /api/approvals — review a submission (admin only, requires CONTENT_APPROVE)
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  const result = validateBody(ReviewSchema, await request.json());
  if (!result.ok) return addHeaders(result.error);

  const existing = approvalsStore.get(result.data.id);
  if (!existing) {
    return addHeaders(
      NextResponse.json({ success: false, message: 'Approval not found' }, { status: 404 }),
    );
  }

  if (existing.status !== 'PENDING') {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'Only PENDING approvals can be reviewed' },
        { status: 409 },
      ),
    );
  }

  const updated: ApprovalItem = {
    ...existing,
    status: result.data.status,
    reviewedBy: result.data.reviewedBy,
    reviewedAt: new Date().toISOString(),
    reviewNote: result.data.reviewNote,
  };

  approvalsStore.set(updated.id, updated);

  const response = addHeaders(NextResponse.json({ success: true, data: updated }));
  logAuditMutation(request, {
    action: 'update',
    targetType: 'approval',
    targetId: updated.id,
    statusCode: response.status,
    metadata: { status: updated.status, reviewedBy: updated.reviewedBy },
  });

  return response;
}
