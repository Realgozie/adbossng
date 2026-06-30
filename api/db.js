import pg from "pg";
const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connStr = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
    pool = new Pool({
      connectionString: connStr,
      ssl: connStr?.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function initDb() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verify_token TEXT,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        is_admin BOOLEAN DEFAULT FALSE,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret TEXT,
        two_factor_pending TEXT,
        reset_token TEXT,
        reset_expiry BIGINT,
        subscription JSONB
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        device TEXT,
        type TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'Draft',
        budget TEXT DEFAULT '$0',
        budget_num NUMERIC DEFAULT 0,
        leads INTEGER DEFAULT 0,
        target_leads INTEGER DEFAULT 0,
        conv TEXT DEFAULT '0%',
        description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        owner_email TEXT NOT NULL,
        member_email TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'Member',
        status TEXT DEFAULT 'Active',
        avatar TEXT,
        color TEXT,
        is_owner BOOLEAN DEFAULT FALSE
      );
    `);
  } finally {
    client.release();
  }
}
