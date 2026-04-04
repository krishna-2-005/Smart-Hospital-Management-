'use server';

// lib/db-server.ts - Server-side only PostgreSQL functions
import 'server-only';

// PostgreSQL client import (for server-side database queries)
let pgPool: any = null;

// Initialize PostgreSQL connection pool if DATABASE_URL is available
async function initializePool() {
  if (pgPool) return pgPool;
  
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set - database queries will fail');
    return null;
  }

  try {
    const { Pool } = await import('pg');
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    return pgPool;
  } catch (error) {
    console.error('Failed to initialize database pool:', error);
    return null;
  }
}

// Get database client for transactions
export async function getClient() {
  const pool = await initializePool();
  if (!pool) throw new Error('Database not configured');
  return pool.connect();
}

// Execute SQL queries
export async function query(text: string, params?: any[]) {
  const pool = await initializePool();
  if (!pool) {
    return { rows: [], command: 'SELECT' };
  }
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
