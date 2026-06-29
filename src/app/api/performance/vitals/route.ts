import { NextRequest, NextResponse } from 'next/server';
import { edgeLog } from '@/../infra/edge-config';
import { query } from '@/lib/db/pool';

export const runtime = 'nodejs';

const RANGE_INTERVALS: Record<string, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  all: '100 years',
};

const POOR_ALERT_THRESHOLD_PCT = 5;
const POOR_CHECK_SESSION_LIMIT = 500;

interface VitalsBody {
  name: string;
  value: number;
  rating: string;
  url?: string;
  timestamp?: number;
  id?: string;
  delta?: number;
  navigationType?: string;
  userAgent?: string;
}

function parseRange(range: string | null): string {
  if (!range || !RANGE_INTERVALS[range]) return RANGE_INTERVALS['7d'];
  return RANGE_INTERVALS[range];
}

function validateMetric(body: unknown): body is VitalsBody {
  if (!body || typeof body !== 'object') return false;
  const m = body as Record<string, unknown>;
  return (
    typeof m.name === 'string' &&
    typeof m.value === 'number' &&
    Number.isFinite(m.value) &&
    typeof m.rating === 'string' &&
    ['good', 'needs-improvement', 'poor'].includes(m.rating)
  );
}

async function checkPoorRate(name: string): Promise<void> {
  const result = await query(
    `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN rating = 'poor' THEN 1 ELSE 0 END) AS poor_count
    FROM (
      SELECT rating FROM web_vitals
      WHERE name = $1
      ORDER BY created_at DESC
      LIMIT $2
    ) recent
    `,
    [name, POOR_CHECK_SESSION_LIMIT],
  );

  const row = result.rows[0] as { total: number; poor_count: number } | undefined;
  if (!row || row.total === 0) return;

  const poorPct = (row.poor_count / row.total) * 100;
  if (poorPct > POOR_ALERT_THRESHOLD_PCT) {
    console.warn(
      `[PERFORMANCE ALERT] "${name}" poor-rate ${poorPct.toFixed(
        1,
      )}% exceeds ${POOR_ALERT_THRESHOLD_PCT}% threshold (${row.poor_count}/${
        row.total
      } recent sessions)`,
    );
  }
}

export async function POST(request: NextRequest) {
  edgeLog('info', '/api/performance/vitals', 'POST request received');
  try {
    const body: unknown = await request.json();

    if (!validateMetric(body)) {
      return NextResponse.json(
        { success: false, message: 'Invalid metric payload' },
        { status: 400 },
      );
    }

    const { name, value, rating, url, timestamp } = body;

    const result = await query(
      `INSERT INTO web_vitals (name, value, rating, page_url, created_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5::double precision / 1000))
       RETURNING id`,
      [name, value, rating, url ?? '/', timestamp ?? Date.now()],
    );

    const insertedId = result.rows[0]?.id as string | undefined;

    if (rating === 'poor') {
      console.warn(
        `[PERFORMANCE ALERT] Critical degradation detected for ${name} on ${
          url ?? '/'
        }. Value: ${value}`,
      );
      await checkPoorRate(name);
    } else if (rating === 'needs-improvement') {
      console.info(
        `[PERFORMANCE WARNING] ${name} needs improvement on ${url ?? '/'}. Value: ${value}`,
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Metric received and persisted',
      id: insertedId,
      alertTriggered: rating === 'poor',
    });
  } catch (error) {
    console.error('[Performance Analytics] Error processing metric:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  edgeLog('info', '/api/performance/vitals', 'GET request received');
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range');
    const interval = parseRange(range);

    const result = await query(
      `
      SELECT
        name,
        page_url,
        COUNT(*)::int AS total_sessions,
        ROUND(AVG(value)::numeric, 4)::float8 AS avg_value,
        ROUND(
          SUM(CASE WHEN rating = 'poor' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
          2
        )::float8 AS poor_rate_pct
      FROM web_vitals
      WHERE created_at > NOW() - $1::interval
      GROUP BY name, page_url
      ORDER BY poor_rate_pct DESC, total_sessions DESC
      `,
      [interval],
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
      range: range ?? '7d',
    });
  } catch (error) {
    console.error('[Performance Analytics] Error fetching vitals:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch metrics' },
      { status: 500 },
    );
  }
}
