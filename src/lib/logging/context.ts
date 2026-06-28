export interface LogContextStore {
  requestId?: string;
  correlationId?: string;
  traceId?: string;
}

class SimpleAsyncLocalStorage<T> {
  private store: T | undefined;
  getStore(): T | undefined {
    return this.store;
  }
  run<R>(store: T, callback: () => R): R {
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = undefined;
    }
  }
}

export const logContextStorage = new SimpleAsyncLocalStorage<LogContextStore>();

export function runWithLogContext<T>(context: LogContextStore, callback: () => T): T {
  return logContextStorage.run(context, callback);
}

export function getLogContext(): LogContextStore | undefined {
  return logContextStorage.getStore();
}
