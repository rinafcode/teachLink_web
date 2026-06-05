import {
  TipNotarizationPayload,
  TipNotarizationRecord,
  buildNotarizationHash,
  generateNotarizationId,
} from '@/lib/notarization';

const notarizationStore = new Map<string, TipNotarizationRecord>();

export function saveTipNotarization(payload: TipNotarizationPayload): TipNotarizationRecord {
  const proof = buildNotarizationHash(payload);
  const id = generateNotarizationId(payload);
  const record: TipNotarizationRecord = {
    id,
    proof,
    recordedAt: new Date(payload.timestamp).toISOString(),
    payload,
  };

  notarizationStore.set(id, record);
  return record;
}

export function getTipNotarization(id: string): TipNotarizationRecord | undefined {
  return notarizationStore.get(id);
}
