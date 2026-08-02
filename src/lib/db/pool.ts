import { Pool, PoolConfig, QueryResult } from 'pg';
import { createLogger } from '@/lib/logging';
import { logContextStorage } from '@/lib/logging/context';
import { retryWithBackoff } from '@/utils/errorUtils';

const logger = createLogger('db-pool');

/**
 * Database Connection Pool Management
 * Configures and maintains a singleton PostgreSQL connection pool
 * with integrated monitoring and resource management.
 *
 * Features:
 * - Automatic reconnect on transient connection errors (exponential backoff)
 * - Circuit breaker: surfaces 503 errors after N consecutive failures
 * - Query queueing during reconnect windows
 */

const getSSLConfig = () => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DB_SSL_CA) {
      throw new Error(
        'DB_SSL_CA environment variable is required in production. ' +
          'This should contain the path to your CA certificate file.',
      );
    }
    return {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA,
    };
  }
  // Allow unverified certificates in development
  return false;
};

const getDbConfig = (): PoolConfig => ({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  ssl: getSSLConfig(),
});

type CircuitState = 'CLOSED' | 'OPEN';

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS = 60_000;

interface QueuedQuery {
  execute: () => Promise<QueryResult>;
  resolve: (value: QueryResult | PromiseLike<QueryResult>) => void;
  reject: (reason?: unknown) => void;
}

class DatabasePool {
  private static instance: Pool;
  private static circuitState: CircuitState = 'CLOSED';
  private static consecutiveFailures = 0;
  private static lastFailureTime = 0;
  private static isReconnecting = false;
  private static queryQueue: QueuedQuery[] = [];

  private constructor() {}

  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool(getDbConfig());

      DatabasePool.instance.on('connect', () => {
        if (process.env.NODE_ENV === 'development') {
          const traceId = logContextStorage.getStore()?.traceId ?? '';
          logger.info('[DB Pool] New client connected to database', {
            context: { traceId },
          });
        }

        DatabasePool.consecutiveFailures = 0;
        if (DatabasePool.circuitState === 'OPEN') {
          DatabasePool.circuitState = 'CLOSED';
        }
      });

      DatabasePool.instance.on('error', (err) => {
        const traceId = logContextStorage.getStore()?.traceId ?? '';
        logger.error('[DB Pool] Unexpected error on idle client', {
          error: err,
          context: { traceId },
        });

        DatabasePool.consecutiveFailures++;
        DatabasePool.lastFailureTime = Date.now();

        if (DatabasePool.consecutiveFailures >= FAILURE_THRESHOLD) {
          DatabasePool.circuitState = 'OPEN';
          DatabasePool.rejectQueue(err);
        } else if (!DatabasePool.isReconnecting) {
          DatabasePool.isReconnecting = true;
          DatabasePool.attemptReconnect();
        }
      });
    }
    return DatabasePool.instance;
  }

  private static async attemptReconnect(): Promise<void> {
    try {
      await retryWithBackoff(
        async () => {
          const client = await DatabasePool.instance.connect();
          client.release();
        },
        { maxAttempts: FAILURE_THRESHOLD, initialDelayMs: 1000, maxDelayMs: 30_000 },
      );

      DatabasePool.consecutiveFailures = 0;
      DatabasePool.circuitState = 'CLOSED';
      DatabasePool.isReconnecting = false;
      DatabasePool.processQueue();
    } catch (err) {
      DatabasePool.isReconnecting = false;
      DatabasePool.circuitState = 'OPEN';
      DatabasePool.lastFailureTime = Date.now();
      DatabasePool.rejectQueue(err);
    }
  }

  public static isCircuitOpen(): boolean {
    if (DatabasePool.circuitState === 'OPEN') {
      if (
        DatabasePool.lastFailureTime > 0 &&
        Date.now() - DatabasePool.lastFailureTime > RESET_TIMEOUT_MS
      ) {
        DatabasePool.circuitState = 'CLOSED';
        DatabasePool.consecutiveFailures = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  private static processQueue(): void {
    const queue = DatabasePool.queryQueue.splice(0);
    for (const item of queue) {
      item.execute().then(item.resolve).catch(item.reject);
    }
  }

  private static rejectQueue(err: unknown): void {
    const queue = DatabasePool.queryQueue.splice(0);
    for (const item of queue) {
      item.reject(err);
    }
  }

  public static async queryWithRetry(text: string, params?: unknown[]): Promise<QueryResult> {
    if (DatabasePool.isCircuitOpen()) {
      const error = new Error('Database service unavailable');
      (error as Error & { statusCode: number }).statusCode = 503;
      throw error;
    }

    if (DatabasePool.isReconnecting) {
      return new Promise<QueryResult>((resolve, reject) => {
        DatabasePool.queryQueue.push({
          execute: () => DatabasePool.queryWithRetry(text, params),
          resolve,
          reject,
        });
      });
    }

    try {
      const result = await retryWithBackoff(() => DatabasePool.getInstance().query(text, params), {
        maxAttempts: 3,
        initialDelayMs: 500,
        maxDelayMs: 5000,
      });

      DatabasePool.consecutiveFailures = 0;
      return result;
    } catch (error) {
      DatabasePool.consecutiveFailures++;
      DatabasePool.lastFailureTime = Date.now();

      if (DatabasePool.consecutiveFailures >= FAILURE_THRESHOLD) {
        DatabasePool.circuitState = 'OPEN';
      }

      throw error;
    }
  }

  public static getMetrics() {
    if (!DatabasePool.instance) {
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingCount: 0,
        circuitState: 'CLOSED' as CircuitState,
        consecutiveFailures: 0,
        queuedQueries: 0,
      };
    }

    return {
      totalConnections: DatabasePool.instance.totalCount,
      idleConnections: DatabasePool.instance.idleCount,
      waitingCount: DatabasePool.instance.waitingCount,
      circuitState: DatabasePool.circuitState,
      consecutiveFailures: DatabasePool.consecutiveFailures,
      queuedQueries: DatabasePool.queryQueue.length,
    };
  }

  public static async end(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end();
    }
  }
}

export interface UserAuthRecord {
  id: string;
  password_hash: string;
  role: string;
}

/**
 * Precomputed bcrypt hash used when no user record exists so password
 * verification takes comparable time and cannot reveal valid emails.
 */
export const TIMING_SAFE_DUMMY_HASH =
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function findUserByEmail(email: string): Promise<UserAuthRecord | null> {
  const result = await query('SELECT id, password_hash, role FROM users WHERE email = $1', [
    email,
  ]);

  if (!result.rows.length) {
    return null;
  }

  return result.rows[0] as UserAuthRecord;
}

export const dbPool = DatabasePool;
export const query = (text: string, params?: unknown[]) => {
  const traceId = logContextStorage.getStore()?.traceId ?? '';
  if (traceId && process.env.NODE_ENV === 'development') {
    logger.debug('[DB Query]', { context: { text: text.slice(0, 100), traceId } });
  }
  return DatabasePool.queryWithRetry(text, params);
};