import { LogQuery, LogRecord, LogTransport } from './types';

declare global {
  var __TEACHLINK_LOG_RECORDS__: LogRecord[] | undefined;
}

function getStore(): LogRecord[] {
  if (!globalThis.__TEACHLINK_LOG_RECORDS__) {
    globalThis.__TEACHLINK_LOG_RECORDS__ = [];
  }

  return globalThis.__TEACHLINK_LOG_RECORDS__;
}

function matchesQuery(record: LogRecord, query: LogQuery): boolean {
  if (query.level) {
    const levels = Array.isArray(query.level) ? query.level : [query.level];
    if (!levels.includes(record.level)) {
      return false;
    }
  }

  if (query.scope && record.scope !== query.scope) {
    return false;
  }

  if (query.requestId && record.requestId !== query.requestId) {
    return false;
  }

  if (query.since && new Date(record.timestamp).getTime() < query.since) {
    return false;
  }

  if (query.search) {
    const haystack = JSON.stringify(record).toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) {
      return false;
    }
  }

  return true;
}

export class InMemoryLogTransport implements LogTransport {
  name = 'in-memory';

  constructor(private readonly maxEntries: number = 500) {}

  write(record: LogRecord): void {
    const store = getStore();
    store.push(record);

    if (store.length > this.maxEntries) {
      store.splice(0, store.length - this.maxEntries);
    }
  }

  query(query: LogQuery): LogRecord[] {
    const store = getStore();
    const filtered = store.filter((record) => matchesQuery(record, query));
    const limit = query.limit ?? filtered.length;
    return filtered.slice(-limit);
  }
}

export class HttpLogTransport implements LogTransport {
  name = 'http';

  constructor(private readonly endpoint: string) {}

  async write(record: LogRecord): Promise<void> {
    if (!this.endpoint || typeof fetch !== 'function') {
      return;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
    } catch {
      // Avoid breaking the app because a remote transport is unavailable.
    }
  }
}

export function queryLogRecords(query: LogQuery): LogRecord[] {
  return new InMemoryLogTransport().query(query);
}
