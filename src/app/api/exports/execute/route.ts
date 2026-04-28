/**
 * Execute Export API
 * POST /api/exports/execute - Execute an export immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { schedulerService, ExportOptions } from '@/lib/export-scheduler';

// Mock user ID - in production, get from auth session
const getCurrentUserId = (): string => 'user-123';

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();

    const options: ExportOptions = {
      templateId: body.templateId,
      scheduleId: body.scheduleId,
      immediate: true,
    };

    const result = await schedulerService.executeExport(options, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error executing export:', error);
    return NextResponse.json({ error: 'Failed to execute export' }, { status: 500 });
  }
}
