/**
 * Export Schedules API
 * GET /api/exports/schedules - List schedules
 * POST /api/exports/schedules - Create schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createSchedule,
  getSchedulesByUser,
  CreateScheduleInput,
  getNextRunTime,
  frequencyToCron,
  validateCronExpression,
} from '@/lib/export-scheduler';

// Mock user ID - in production, get from auth session
const getCurrentUserId = (): string => 'user-123';

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const schedules = await getSchedulesByUser(userId);

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();

    // Validate cron expression if provided
    const cronExpression = body.cronExpression || frequencyToCron(body.frequency);
    if (!validateCronExpression(cronExpression)) {
      return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 });
    }

    const input: CreateScheduleInput = {
      templateId: body.templateId,
      name: body.name,
      frequency: body.frequency,
      cronExpression: body.cronExpression,
      emailDelivery: body.emailDelivery,
      emailRecipients: body.emailRecipients,
    };

    const nextRunAt = getNextRunTime(cronExpression);
    const schedule = await createSchedule(input, userId, nextRunAt);

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
