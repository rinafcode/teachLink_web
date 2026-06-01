import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { validateQuery, validateBody } from '@/lib/validation';
import { edgeLog } from '@/../infra/edge-config';
import {
  TutorialListQuerySchema,
  CreateTutorialSchema,
  type TutorialListResponseDTO,
  type TutorialResponseDTO,
} from '@/types/api/tutorials.dto';

export const runtime = 'edge';

const MOCK_TUTORIALS = [
  {
    id: '1',
    title: 'Getting Started with Starknet',
    description: 'A beginner-friendly guide to building on Starknet',
    content: '# Getting Started\n\nStarknet is a permissionless ZK-Rollup...',
    tags: ['starknet', 'web3', 'beginner'],
    author: 'Alice',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Cairo Smart Contract Basics',
    description: 'Learn to write your first Cairo smart contract',
    content: '# Cairo Basics\n\nCairo is a Turing-complete language...',
    tags: ['cairo', 'smart-contracts', 'intermediate'],
    author: 'Bob',
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
  },
  {
    id: '3',
    title: 'DeFi Protocols on Starknet',
    description: 'Deep dive into decentralized finance on Starknet',
    content: '# DeFi on Starknet\n\nDecentralized finance protocols...',
    tags: ['defi', 'starknet', 'advanced'],
    author: 'Carol',
    createdAt: '2025-01-03T00:00:00.000Z',
    updatedAt: '2025-01-03T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// GET /api/tutorials
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse<TutorialListResponseDTO>> {
  edgeLog('info', '/api/tutorials', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) return rateLimitResponse as NextResponse<TutorialListResponseDTO>;

  const { searchParams } = new URL(request.url);
  const result = validateQuery(TutorialListQuerySchema, searchParams);
  if (!result.ok) return addHeaders(result.error) as NextResponse<TutorialListResponseDTO>;

  const { limit, cursor } = result.data;
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const page = MOCK_TUTORIALS.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + limit;
  const nextCursor = nextIndex < MOCK_TUTORIALS.length ? String(nextIndex) : undefined;

  return addHeaders(NextResponse.json({ data: page, total: MOCK_TUTORIALS.length, nextCursor }));
}

// ---------------------------------------------------------------------------
// POST /api/tutorials
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse<TutorialResponseDTO>> {
  edgeLog('info', '/api/tutorials', 'POST request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'WRITE');
  if (rateLimitResponse) return rateLimitResponse as NextResponse<TutorialResponseDTO>;

  const result = validateBody(CreateTutorialSchema, await request.json());
  if (!result.ok) return addHeaders(result.error) as NextResponse<TutorialResponseDTO>;

  const { title, description, content, tags } = result.data;
  const now = new Date().toISOString();

  const tutorial = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    description,
    content,
    tags,
    author: 'current-user',
    createdAt: now,
    updatedAt: now,
  };

  return addHeaders(NextResponse.json({ data: tutorial }, { status: 201 }));
}
