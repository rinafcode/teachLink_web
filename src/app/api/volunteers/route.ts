import { NextResponse } from 'next/server';
import type { Volunteer } from '@/types/volunteer';

// In-memory store for edge runtime (production would use a DB)
const volunteers: Volunteer[] = [];

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({ data: volunteers, total: volunteers.length });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, role, status, sms } = body as Partial<Volunteer>;

  if (!name || !email || !role) {
    return NextResponse.json({ error: 'name, email, and role are required' }, { status: 400 });
  }

  const volunteer: Volunteer = {
    id: `vol_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    name,
    email,
    role,
    status: status ?? 'pending',
    sms: sms ?? { optedIn: false, phoneNumber: '', categories: [] },
    joinedAt: new Date().toISOString(),
  };

  volunteers.push(volunteer);
  return NextResponse.json({ data: volunteer }, { status: 201 });
}
