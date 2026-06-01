import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog } from '@/../infra/edge-config';
import type { TutorialResponseDTO } from '@/types/api/tutorials.dto';

export const runtime = 'edge';

const MOCK_TUTORIALS: Record<string, TutorialResponseDTO['data']> = {
  '1': {
    id: '1',
    title: 'Getting Started with Starknet',
    description: 'A beginner-friendly guide to building on Starknet',
    content: '# Getting Started\n\nStarknet is a permissionless ZK-Rollup...',
    tags: ['starknet', 'web3', 'beginner'],
    author: 'Alice',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  '2': {
    id: '2',
    title: 'Cairo Smart Contract Basics',
    description: 'Learn to write your first Cairo smart contract',
    content: '# Cairo Basics\n\nCairo is a Turing-complete language...',
    tags: ['cairo', 'smart-contracts', 'intermediate'],
    author: 'Bob',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
  '3': {
    id: '3',
    title: 'DeFi Protocols on Starknet',
    description: 'Deep dive into decentralized finance on Starknet',
    content: '# DeFi on Starknet\n\nDecentralized finance protocols...',
    tags: ['defi', 'starknet', 'advanced'],
    author: 'Carol',
    createdAt: '2025-01-03T00:00:00.000Z',
    updatedAt: '2025-01-03T00:00:00.000Z',
  },
};

// ---------------------------------------------------------------------------
// GET /api/tutorials/[id]
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<TutorialResponseDTO | { error: string }>> {
  edgeLog('info', '/api/tutorials/[id]', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) return rateLimitResponse as NextResponse;

  const { id } = await params;
  const tutorial = MOCK_TUTORIALS[id];

  if (!tutorial) {
    return addHeaders(
      NextResponse.json({ error: 'Tutorial not found' }, { status: 404 }),
    );
  }

  return addHeaders(NextResponse.json({ data: tutorial }));
}
