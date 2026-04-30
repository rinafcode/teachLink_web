import { Pool, PoolConfig } from 'pg';

/**
 * Database Connection Pool Management
 * Configures and maintains a singleton PostgreSQL connection pool
 * with integrated monitoring and resource management.
 */

const DB_CONFIG: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  // Enable SSL in production if needed
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

class DatabasePool {
  private static instance: Pool;

  private constructor() {}

  public static getInstance(): Pool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new Pool(DB_CONFIG);

      // Monitoring events
      DatabasePool.instance.on('connect', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DB Pool] New client connected to database');
        }
      });

      DatabasePool.instance.on('acquire', () => {
        // Track acquisition metrics
      });

      DatabasePool.instance.on('error', (err) => {
        console.error('[DB Pool] Unexpected error on idle client', err);
      });
    }
    return DatabasePool.instance;
  }

  /**
   * Get current pool metrics for monitoring
   */
  public static getMetrics() {
    if (!DatabasePool.instance) {
      return {
        totalConnections: 0,
        idleConnections: 0,
        waitingCount: 0,
      };
    }

    return {
      totalConnections: DatabasePool.instance.totalCount,
      idleConnections: DatabasePool.instance.idleCount,
      waitingCount: DatabasePool.instance.waitingCount,
    };
  }

  /**
   * Gracefully shutdown the pool
   */
  public static async end(): Promise<void> {
    if (DatabasePool.instance) {
      await DatabasePool.instance.end();
    }
  }
}

export const dbPool = DatabasePool;
export const query = (text: string, params?: any[]) =>
  DatabasePool.getInstance().query(text, params);
