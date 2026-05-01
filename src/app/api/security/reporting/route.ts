import { NextRequest, NextResponse } from 'next/server';

interface SecurityReportEnvelope {
  type?: string;
  url?: string;
  user_agent?: string;
  body?: unknown;
}

function normalizeReportBody(payload: unknown): SecurityReportEnvelope[] {
  if (Array.isArray(payload)) return payload as SecurityReportEnvelope[];
  if (payload && typeof payload === 'object') return [payload as SecurityReportEnvelope];
  return [];
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const reports = normalizeReportBody(payload);

  if (reports.length > 0) {
    console.warn('[security-reporting] received violation reports', {
      count: reports.length,
      reports,
    });
  }

  return NextResponse.json({ received: reports.length }, { status: 202 });
}
