/**
 * Request Deduplication Cache (#323)
 *
 * Merges concurrent identical requests so only one network call is made.
 * Subsequent callers receive the same promise as the in-flight request.
 */

type Resolver<T> = {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

interface InFlight<T> {
  promise: Promise<T>;
  resolvers: Resolver<T>[];
}

const cache = new Map<string, InFlight<unknown>>();

/**
 * Build a stable cache key from method + url + optional body.
 */
export function buildDedupeKey(method: string, url: string, body?: unknown): string {
  const base = `${method.toUpperCase()}:${url}`;
  return body ? `${base}:${JSON.stringify(body)}` : base;
}

/**
 * Deduplicate an async request factory.
 *
 * If a request with the same key is already in-flight, the caller receives
 * the same promise instead of triggering a new network call.
 *
 * @param key   - Unique identifier for this request (use buildDedupeKey)
 * @param fn    - Factory that performs the actual request
 */
export async function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = cache.get(key) as InFlight<T> | undefined;
  if (existing) {
    return existing.promise;
  }

  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const entry: InFlight<T> = { promise, resolvers: [{ resolve, reject }] };
  cache.set(key, entry as InFlight<unknown>);

  try {
    const result = await fn();
    resolve(result);
    return result;
  } catch (err) {
    reject(err);
    throw err;
  } finally {
    cache.delete(key);
  }
}

/** Remove a specific key from the cache (e.g. on cancellation). */
export function cancelDedupe(key: string): void {
  cache.delete(key);
}

/** Clear the entire deduplication cache. */
export function clearDedupeCache(): void {
  cache.clear();
}
