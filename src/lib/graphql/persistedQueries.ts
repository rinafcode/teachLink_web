import type { GraphQLVariables } from './types';

const PERSISTED_QUERY_VERSION = 1;
const localRegistry = new Map<string, string>();

export interface PersistedQueryPayload {
  query?: string;
  variables?: GraphQLVariables;
  extensions: {
    persistedQuery: {
      version: number;
      sha256Hash: string;
    };
  };
}

export async function sha256(input: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle !== 'undefined') {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  const { createHash } = await import('crypto');
  return createHash('sha256').update(input).digest('hex');
}

export async function buildPersistedQueryPayload(
  query: string,
  variables?: GraphQLVariables,
  persistedOnly = false,
): Promise<PersistedQueryPayload> {
  const hash = await sha256(query);
  const existing = localRegistry.get(hash);

  if (!existing) {
    localRegistry.set(hash, query);
  }

  return {
    query: persistedOnly ? undefined : query,
    variables,
    extensions: {
      persistedQuery: {
        version: PERSISTED_QUERY_VERSION,
        sha256Hash: hash,
      },
    },
  };
}

export function getPersistedQuery(hash: string): string | undefined {
  return localRegistry.get(hash);
}
