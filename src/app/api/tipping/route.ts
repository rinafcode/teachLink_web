import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { saveTipNotarization } from '@/services/notarizationStore';
import { createLogger } from '@/lib/logging';
import { sendTransaction, getServiceAddress } from '@/services/serviceAccount';

const logger = createLogger('api-tipping');

interface TipRequestBody {
  recipientId: string;
  amount: number;
}

interface TipApiResponse {
  txHash: string;
  recipientId: string;
  amount: number;
  id: string;
  proof: string;
  recordedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TipRequestBody>;

    if (!body?.recipientId || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ message: 'Recipient and amount are required' }, { status: 400 });
    }

    const rpcUrl = process.env.TIP_NETWORK_RPC_URL;
    if (!rpcUrl) {
      throw new Error('TIP_NETWORK_RPC_URL is not set');
    }

    const provider = new ethers.JsonRPCProvider(rpcUrl);
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    const senderAddress = await getServiceAddress();

    const tx = {
      to: body.recipientId,
      value: ethers.parseEther(body.amount.toString()),
    };

    const txHash = await sendTransaction(tx, provider);
    const receipt = await provider.waitForTransaction(txHash);
    if (receipt && receipt.status !== 1) {
      throw new Error('Transaction reverted on-chain');
    }
    const verifiedTxHash = receipt?.transactionHash || txHash;

    const timestamp = Date.now();
    const payload = {
      txHash: verifiedTxHash,
      recipientId: body.recipientId,
      amount: body.amount,
      senderAddress,
      chainId: chainId.toString(),
      timestamp,
    } as const;

    const record = saveTipNotarization(payload);
    const response: TipApiResponse = {
      txHash: verifiedTxHash,
      recipientId: body.recipientId,
      amount: body.amount,
      id: record.id,
      proof: record.proof,
      recordedAt: record.recordedAt,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    logger.error('Failed to send tip', { error });
    return NextResponse.json({ message: 'Tip transaction failed. Please retry.' }, { status: 502 });
  }
}
