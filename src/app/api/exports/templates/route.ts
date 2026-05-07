/**
 * Export Templates API
 * GET /api/exports/templates - List templates
 * POST /api/exports/templates - Create template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createTemplate, getTemplatesByUser, CreateTemplateInput } from '@/lib/export-scheduler';

// Mock user ID - in production, get from auth session
const getCurrentUserId = (): string => 'user-123';

export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const templates = await getTemplatesByUser(userId);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId();
    const body = await request.json();

    const input: CreateTemplateInput = {
      name: body.name,
      description: body.description,
      format: body.format,
      dataSource: body.dataSource,
      filters: body.filters,
      columns: body.columns,
    };

    const template = await createTemplate(input, userId);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
