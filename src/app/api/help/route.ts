import { NextResponse } from 'next/server';
import type { BatchRequest, BatchResponse } from '@/lib/api/batch';

export const runtime = 'edge';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

/** Static help content keyed by article id */
const HELP_ARTICLES: Record<string, HelpArticle> = {
  'getting-started': {
    id: 'getting-started',
    title: 'Getting Started with TeachLink',
    content:
      'Welcome to TeachLink! Connect your Starknet wallet to begin exploring courses, earning reputation, and tipping creators.',
    category: 'Onboarding',
    tags: ['wallet', 'starknet', 'beginner'],
  },
  'wallet-connect': {
    id: 'wallet-connect',
    title: 'Connecting Your Wallet',
    content:
      'TeachLink supports Argent X and Braavos wallets. Click the "Connect Wallet" button in the top navigation to get started.',
    category: 'Web3',
    tags: ['wallet', 'argent', 'braavos'],
  },
  'tipping': {
    id: 'tipping',
    title: 'How Tipping Works',
    content:
      'Send on-chain tips to course creators using STRK tokens. Tips are processed via smart contracts on Starknet.',
    category: 'Web3',
    tags: ['tips', 'strk', 'creators'],
  },
  'courses': {
    id: 'courses',
    title: 'Browsing and Enrolling in Courses',
    content:
      'Browse courses by topic, filter by skill level, and enroll with a single click. Progress is tracked on-chain.',
    category: 'Learning',
    tags: ['courses', 'enroll', 'progress'],
  },
  'reputation': {
    id: 'reputation',
    title: 'Building Your Reputation',
    content:
      'Earn reputation points by completing courses, contributing to discussions, and receiving tips from peers.',
    category: 'Gamification',
    tags: ['reputation', 'points', 'achievements'],
  },
};

/**
 * POST /api/help
 *
 * Accepts a batch of help article requests and returns all matching articles
 * in a single response, reducing round-trips for the HelpDocumentation component.
 *
 * Body: { requests: BatchRequest[] }
 * Response: { responses: BatchResponse<HelpArticle>[] }
 */
export async function POST(request: Request) {
  let body: { requests: BatchRequest[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body?.requests)) {
    return NextResponse.json({ error: 'requests must be an array' }, { status: 400 });
  }

  const responses: BatchResponse<HelpArticle>[] = body.requests.map((req) => {
    const article = HELP_ARTICLES[req.path];
    if (!article) {
      return { id: req.id, error: `Article not found: ${req.path}` };
    }
    return { id: req.id, data: article };
  });

  return NextResponse.json({ responses });
}

/**
 * GET /api/help?ids=id1,id2
 *
 * Convenience endpoint for fetching multiple articles by comma-separated ids.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? [];

  if (ids.length === 0) {
    const all = Object.values(HELP_ARTICLES);
    return NextResponse.json({ articles: all });
  }

  const articles = ids.map((id) => HELP_ARTICLES[id.trim()]).filter(Boolean);
  return NextResponse.json({ articles });
}
