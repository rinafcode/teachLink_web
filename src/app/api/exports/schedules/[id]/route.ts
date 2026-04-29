/**
 * Export Schedule API
 * GET /api/exports/schedules/:id - Get schedule
 * PATCH /api/exports/schedules/:id - Update schedule
 * DELETE /api/exports/schedules/:id - Delete schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
  UpdateScheduleInput,
} from '@/lib/export-scheduler';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const schedule = await getSchedule(id);

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: UpdateScheduleInput = {
      name: body.name,
      frequency: body.frequency,
      cronExpression: body.cronExpression,
      enabled: body.enabled,
      emailDelivery: body.emailDelivery,
      emailRecipients: body.emailRecipients,
    };

    const schedule = await updateSchedule(id, updates);

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteSchedule(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
