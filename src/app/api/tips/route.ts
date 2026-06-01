import { NextRequest, NextResponse } from 'next/server';
import { evaluateTipCanary } from '@/lib/featureFlags/tipCanary';

interface TipPayload {
  recipientId: string;
  amount: number;
  groupId: string;
  groupName: string;
}

function validateTipPayload(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Expected a valid tip payload.';
  }

  const payload = body as TipPayload;
  if (!payload.recipientId?.trim()) {
    return 'recipientId is required.';
  }

  if (!payload.groupId?.trim()) {
    return 'groupId is required.';
  }

  if (!payload.groupName?.trim()) {
    return 'groupName is required.';
  }

  if (typeof payload.amount !== 'number' || Number.isNaN(payload.amount) || payload.amount <= 0) {
    return 'Amount must be a positive number.';
  }

  return null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const validationError = validateTipPayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Evaluate canary rollout for Tip Receiving
  const canary = evaluateTipCanary(request);

  // If we created an anon id, attach it to the response so anonymous users are consistently bucketed
  const setCookie = canary.setAnonId;

  // Route to canary or stable implementation based on evaluation
  if (canary.enabled) {
    // Canary path (behaviour can be swapped to new implementation)
    const tipId = `tip_canary_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).slice(2, 8)}`;
    const response = NextResponse.json(
      {
        success: true,
        tipId,
        createdAt: new Date().toISOString(),
        meta: { canary: true },
      },
      { status: 201 },
    );
    if (setCookie) {
      response.cookies.set('anon-user-id', setCookie, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
    }
    return response;
  }

  // Stable (existing) path
  const tipId = `tip_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).slice(2, 8)}`;
  const response = NextResponse.json(
    {
      success: true,
      tipId,
      createdAt: new Date().toISOString(),
    },
    { status: 201 },
  );
  if (setCookie) {
    response.cookies.set('anon-user-id', setCookie, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return response;
}
