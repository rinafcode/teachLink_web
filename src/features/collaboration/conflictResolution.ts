import { getOperationNetDelta } from './operations';
import type { TextOperation } from './types';

const transformIndexAgainstOperation = (index: number, against: TextOperation): number => {
  if (against.type === 'insert') {
    const insertLength = against.text?.length ?? 0;
    if (against.index <= index) {
      return index + insertLength;
    }
    return index;
  }

  const removedLength = against.length ?? 0;
  const start = against.index;
  const end = start + removedLength;

  if (index <= start) {
    return index;
  }

  if (index <= end) {
    return start;
  }

  return index + getOperationNetDelta(against);
};

export const transformIncomingOperation = (
  incomingOperation: TextOperation,
  pendingLocalOperations: TextOperation[],
): TextOperation => {
  const transformed: TextOperation = { ...incomingOperation };

  for (const pending of pendingLocalOperations) {
    if (pending.id === transformed.id) {
      continue;
    }

    transformed.index = transformIndexAgainstOperation(transformed.index, pending);
  }

  return transformed;
};
