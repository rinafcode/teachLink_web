import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/ratelimit';
import { logAuditMutation } from '@/middleware/audit';
import { validateBody, validateQuery } from '@/lib/validation';
import { ApprovalStatus } from '@/types/approvals';
import { query } from '@/lib/db/pool';
import type { ApprovalItem, ReviewDecision } from '@/types/api';
import { getCsrfTokenFromCookies, getCsrfTokenFromHeaders } from '@/lib/csrfMiddleware';

export const runtime = 'nodejs';

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
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  reviewedBy: z.string().min(1),
  reviewNote: z.string().max(500).optional(),
});

const ListQuerySchema = z.object({
  status: z
    .enum([ApprovalStatus.PENDING, ApprovalStatus.APPROVED, ApprovalStatus.REJECTED])
    .optional(),
});

const COLUMNS = `
  id::text,
  content_id AS "contentId",
  content_type AS "contentType",
  title,
  submitted_by AS "submittedBy",
  submitted_at AS "submittedAt",
  status,
  reviewed_by AS "reviewedBy",
  reviewed_at AS "reviewedAt",
  review_note AS "reviewNote"
` as const;

// ---------------------------------------------------------------------------
// GET /api/approvals — list submissions (admin: all; others: filtered by submittedBy)
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const validation = validateQuery(ListQuerySchema, searchParams);
  if (!validation.ok) return addHeaders(validation.error);

  try {
    const dbResult = await query(
      `SELECT ${COLUMNS} FROM content_approvals WHERE ($1::text IS NULL OR status = $1) ORDER BY submitted_at DESC`,
      [validation.data.status ?? null],
    );

    return addHeaders(NextResponse.json({ success: true, data: dbResult.rows }));
  } catch (error) {
    console.error('[approvals] GET error:', error);
    return addHeaders(
      NextResponse.json({ success: false, message: 'Database error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/approvals — submit content for approval (non-admin / RunAsNonRoot)
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  // CSRF validation
  const cookieToken = getCsrfTokenFromCookies(request as any);
  const headerToken = getCsrfTokenFromHeaders(request as any);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'CSRF token validation failed' },
        { status: 403 }
      )
    );
  }

  const validation = validateBody(SubmitSchema, await request.json());
  if (!validation.ok) return addHeaders(validation.error);

  try {
    const dbResult = await query(
      `INSERT INTO content_approvals (content_id, content_type, title, submitted_by) VALUES ($1, $2, $3, $4) RETURNING ${COLUMNS}`,
      [
        validation.data.contentId,
        validation.data.contentType,
        validation.data.title,
        validation.data.submittedBy,
      ],
    );

    const item = dbResult.rows[0] as ApprovalItem;

    const response = addHeaders(NextResponse.json({ success: true, data: item }, { status: 201 }));
    logAuditMutation(request, {
      action: 'create',
      targetType: 'approval',
      targetId: item.id,
      statusCode: response.status,
      metadata: { contentId: item.contentId, contentType: item.contentType },
    });

    return response;
  } catch (error) {
    console.error('[approvals] POST error:', error);
    return addHeaders(
      NextResponse.json({ success: false, message: 'Database error' }, { status: 500 }),
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/approvals — review a submission (admin only, requires CONTENT_APPROVE)
// ---------------------------------------------------------------------------

export async function PATCH(request: Request): Promise<NextResponse> {
  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse;

  // CSRF validation
  const cookieToken = getCsrfTokenFromCookies(request as any);
  const headerToken = getCsrfTokenFromHeaders(request as any);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return addHeaders(
      NextResponse.json(
        { success: false, message: 'CSRF token validation failed' },
        { status: 403 }
      )
    );
  }

  const validation = validateBody(ReviewSchema, await request.json());
  if (!validation.ok) return addHeaders(validation.error);

  try {
    const dbResult = await query(
      `UPDATE content_approvals SET status = $2, reviewed_by = $3, reviewed_at = NOW(), review_note = $4 WHERE id = $1::uuid AND status = 'PENDING' RETURNING ${COLUMNS}`,
      [
        validation.data.id,
        validation.data.status,
        validation.data.reviewedBy,
        validation.data.reviewNote ?? null,
      ],
    );

    if (dbResult.rows.length === 0) {
      const exists = await query('SELECT id FROM content_approvals WHERE id = $1::uuid', [
        validation.data.id,
      ]);
      if (exists.rows.length === 0) {
        return addHeaders(
          NextResponse.json({ success: false, message: 'Approval not found' }, { status: 404 }),
        );
      }
      return addHeaders(
        NextResponse.json(
          { success: false, message: 'Only PENDING approvals can be reviewed' },
          { status: 409 },
        ),
      );
    }

    const updated = dbResult.rows[0] as ApprovalItem;

    const response = addHeaders(NextResponse.json({ success: true, data: updated }));
    logAuditMutation(request, {
      action: 'update',
      targetType: 'approval',
      targetId: updated.id,
      statusCode: response.status,
      metadata: { status: updated.status, reviewedBy: updated.reviewedBy },
    });

    return response;
  } catch (error) {
    console.error('[approvals] PATCH error:', error);
    return addHeaders(
      NextResponse.json({ success: false, message: 'Database error' }, { status: 500 }),
    );
  }
}
