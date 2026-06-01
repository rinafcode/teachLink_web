import { NextRequest } from 'next/server';

interface CanaryResult {
  enabled: boolean;
  bucket: number;
  percent: number;
  identifier?: string;
  // When true, caller should set this anon id cookie to keep bucketing stable for anonymous users
  setAnonId?: string;
}

function djb2Hash(input: string) {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + c
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  // Convert to unsigned 32-bit
  return hash >>> 0;
}

function clampPercent(value: number) {
  if (Number.isNaN(value) || value < 0) return 0;
  if (value > 100) return 100;
  return Math.floor(value);
}

export function evaluateTipCanary(request: NextRequest): CanaryResult {
  const raw =
    process.env.TIP_RECEIVING_CANARY_PERCENT ??
    process.env.NEXT_PUBLIC_TIP_RECEIVING_CANARY_PERCENT ??
    '0';
  const percent = clampPercent(Number(raw));

  if (percent <= 0) {
    return { enabled: false, bucket: 0, percent };
  }

  // Try to get a stable identifier for the user
  const userId =
    request.cookies.get('user-id')?.value ||
    request.headers.get('x-user-id') ||
    request.cookies.get('anon-user-id')?.value;

  let identifier = userId;
  let setAnonId: string | undefined;

  if (!identifier) {
    // generate a stable-ish anon id and instruct caller to set cookie
    const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    identifier = `anon_${rand}`;
    setAnonId = identifier;
  }

  const hash = djb2Hash(identifier);
  const bucket = (hash % 100) + 1; // 1..100
  const enabled = bucket <= percent;

  // Structured log for rollout decision (no sensitive identifiers)
  try {
    // Logging minimal data: percent, bucket, enabled
    // Consumers can hook into logs to build metrics
    console.info(JSON.stringify({ event: 'tip_canary_evaluation', percent, bucket, enabled }));
  } catch {}

  return { enabled, bucket, percent, identifier: setAnonId ? undefined : identifier, setAnonId };
}

export {};
