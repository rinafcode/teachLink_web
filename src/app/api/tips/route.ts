import { NextRequest, NextResponse } from 'next/server';

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

  const tipId = `tip_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).slice(2, 8)}`;
  return NextResponse.json(
    {
      success: true,
      tipId,
      createdAt: new Date().toISOString(),
    },
    { status: 201 },
  );
}
