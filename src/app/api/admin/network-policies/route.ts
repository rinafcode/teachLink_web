import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory store for network policies (replace with DB layer in production).
 */

export type PolicyAction = 'ALLOW' | 'DENY';
export type PolicyScope = 'IP' | 'CIDR' | 'COUNTRY';

interface NetworkPolicy {
  id: string;
  scope: PolicyScope;
  value: string;
  action: PolicyAction;
  description?: string;
  createdAt: string;
}

const store: NetworkPolicy[] = [];

function generateId(): string {
  return `np_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export async function GET() {
  return NextResponse.json({ success: true, data: store });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scope, value, action, description } = body as Partial<NetworkPolicy>;

    if (!scope || !['IP', 'CIDR', 'COUNTRY'].includes(scope)) {
      return NextResponse.json({ success: false, message: 'Invalid scope' }, { status: 400 });
    }
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return NextResponse.json({ success: false, message: 'Value is required' }, { status: 400 });
    }
    if (!action || !['ALLOW', 'DENY'].includes(action)) {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    const policy: NetworkPolicy = {
      id: generateId(),
      scope,
      value: value.trim(),
      action,
      description: typeof description === 'string' ? description.slice(0, 200) : undefined,
      createdAt: new Date().toISOString(),
    };

    store.unshift(policy);
    return NextResponse.json({ success: true, data: policy }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'id is required' }, { status: 400 });
  }

  const index = store.findIndex((p) => p.id === id);
  if (index === -1) {
    return NextResponse.json({ success: false, message: 'Policy not found' }, { status: 404 });
  }

  store.splice(index, 1);
  return NextResponse.json({ success: true });
}
