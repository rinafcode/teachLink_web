import type { TextOperation } from './types';

interface CreateOperationMeta {
  roomId: string;
  clientId: string;
  baseVersion: number;
  timestamp: number;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const generateOperationId = (clientId: string, timestamp: number): string => {
  return `${clientId}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
};

export const applyTextOperation = (content: string, operation: TextOperation): string => {
  const safeIndex = clamp(operation.index, 0, content.length);

  if (operation.type === 'insert') {
    const insertion = operation.text ?? '';
    return `${content.slice(0, safeIndex)}${insertion}${content.slice(safeIndex)}`;
  }

  const length = clamp(operation.length ?? 0, 0, content.length - safeIndex);

  if (operation.type === 'delete') {
    return `${content.slice(0, safeIndex)}${content.slice(safeIndex + length)}`;
  }

  const replacement = operation.text ?? '';
  return `${content.slice(0, safeIndex)}${replacement}${content.slice(safeIndex + length)}`;
};

export const createTextOperationFromChange = (
  previous: string,
  next: string,
  meta: CreateOperationMeta,
): TextOperation | null => {
  if (previous === next) {
    return null;
  }

  let prefixLength = 0;
  const minLength = Math.min(previous.length, next.length);

  while (prefixLength < minLength && previous[prefixLength] === next[prefixLength]) {
    prefixLength += 1;
  }

  let previousSuffix = previous.length;
  let nextSuffix = next.length;

  while (
    previousSuffix > prefixLength &&
    nextSuffix > prefixLength &&
    previous[previousSuffix - 1] === next[nextSuffix - 1]
  ) {
    previousSuffix -= 1;
    nextSuffix -= 1;
  }

  const removedLength = previousSuffix - prefixLength;
  const insertedText = next.slice(prefixLength, nextSuffix);

  let type: TextOperation['type'] = 'replace';
  if (removedLength === 0) {
    type = 'insert';
  } else if (insertedText.length === 0) {
    type = 'delete';
  }

  return {
    id: generateOperationId(meta.clientId, meta.timestamp),
    roomId: meta.roomId,
    clientId: meta.clientId,
    baseVersion: meta.baseVersion,
    type,
    index: prefixLength,
    length: removedLength > 0 ? removedLength : undefined,
    text: insertedText.length > 0 ? insertedText : undefined,
    timestamp: meta.timestamp,
  };
};

export const getOperationNetDelta = (operation: TextOperation): number => {
  const insertedLength = operation.text?.length ?? 0;
  const removedLength = operation.length ?? 0;
  return insertedLength - removedLength;
};
