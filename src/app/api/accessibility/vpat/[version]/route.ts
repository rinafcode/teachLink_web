import { NextResponse } from 'next/server';
import {
  VPAT_CDN_CACHE_CONTROL,
  parsePublishedVPATReport,
} from '@/lib/accessibilityReporting';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ version: string }> },
): Promise<NextResponse> {
  const { version: rawVersion } = await params;
  let version: string;
  try {
    version = decodeURIComponent(rawVersion).replace(/\.json$/, '');
  } catch {
    return NextResponse.json({ error: 'VPAT report not found' }, { status: 404 });
  }
  const reportJson = process.env.VPAT_REPORT_JSON;
  const report = reportJson ? parsePublishedVPATReport(reportJson, version) : null;

  if (!report) {
    return NextResponse.json({ error: 'VPAT report not found' }, { status: 404 });
  }

  const response = NextResponse.json(report, {
    headers: {
      'Cache-Control': VPAT_CDN_CACHE_CONTROL,
      'Content-Disposition': `inline; filename="vpat-${version}.json"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
  response.headers.set('CDN-Cache-Control', VPAT_CDN_CACHE_CONTROL);
  response.headers.set('Surrogate-Control', VPAT_CDN_CACHE_CONTROL);
  return response;
}