import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { saveTipNotarization } from '@/services/notarizationStore';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api-tipping');

interface TipRequestBody {
  recipientId: string;
  amount: number;
}

interface TipApiResponse {
  txHash: string;
  recipientId: string;
  amount: number;
  notarizationId: string;
  notarizationProof: string;
  notarizedAt: string;
}

function createTransactionHash(): string {
  return `0x${randomBytes(16).toString('hex')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TipRequestBody>;

    if (!body?.recipientId || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ message: 'Recipient and amount are required' }, { status: 400 });
    }

    const txHash = createTransactionHash();
    const timestamp = Date.now();
    const payload = {
      txHash,
      recipientId: body.recipientId,
      amount: body.amount,
      senderAddress: 'anonymous',
      chainId: 'server',
      timestamp,
    } as const;

    const record = saveTipNotarization(payload);
    const response: TipApiResponse = {
      txHash,
      recipientId: body.recipientId,
      amount: body.amount,
      notarizationId: record.id,
      notarizationProof: record.proof,
      notarizedAt: record.recordedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Failed to send tip', { error });
    return NextResponse.json({ message: 'Failed to process tipping request' }, { status: 500 });
  }
}
