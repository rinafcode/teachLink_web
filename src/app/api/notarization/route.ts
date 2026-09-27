import { NextRequest, NextResponse } from 'next/server';
import { saveTipNotarization } from '@/services/notarizationStore';
import { createLogger } from '@/lib/logging';

const logger = createLogger('api-notarization');

interface NotarizationPayload {
  txHash: string;
  recipientId: string;
  amount: number;
  senderAddress: string;
  chainId: string;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<NotarizationPayload>;

    if (
      !body?.txHash ||
      !body?.recipientId ||
      typeof body.amount !== 'number' ||
      !body?.senderAddress ||
      !body?.chainId ||
      typeof body.timestamp !== 'number'
    ) {
      return NextResponse.json({ message: 'Invalid notarization payload' }, { status: 400 });
    }

    const record = saveTipNotarization({
      txHash: body.txHash,
      recipientId: body.recipientId,
      amount: body.amount,
      senderAddress: body.senderAddress,
      chainId: body.chainId,
      timestamp: body.timestamp,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    logger.error('Error creating notarization', { error });
    return NextResponse.json({ message: 'Failed to create notarization' }, { status: 500 });
  }
}
