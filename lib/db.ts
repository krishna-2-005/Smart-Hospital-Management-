import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

function normalizeDbError(error: unknown): Error {
  if (error instanceof Error && error.message) {
    return error;
  }

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : null;

  const message = code
    ? `Database connection failed (${code}). Check DATABASE_URL and ensure PostgreSQL is running.`
    : 'Database operation failed. Check DATABASE_URL and ensure PostgreSQL is running.';

  const normalizedError = new Error(message);
  (normalizedError as Error & { code?: string }).code = code || undefined;
  return normalizedError;
}

export function initializePool() {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        pool = null;
      });
    } catch (error) {
      console.error('Failed to initialize database pool:', error);
      pool = null;
    }
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const dbPool = initializePool();
  if (!dbPool) {
    throw new Error('Database pool not initialized. Please set DATABASE_URL environment variable.');
  }
  try {
    return await dbPool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw normalizeDbError(error);
  }
}

export async function getClient(): Promise<PoolClient> {
  const dbPool = initializePool();
  if (!dbPool) {
    throw new Error('Database pool not initialized. Please set DATABASE_URL environment variable.');
  }
  return dbPool.connect();
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
