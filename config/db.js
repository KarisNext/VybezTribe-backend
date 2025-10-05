// File: backend/config/db.js - REVISED FOR CPANEL PRODUCTION
const { Pool } = require('pg');
require('dotenv').config();

let pool = null;

const createPool = () => {
  if (!pool) {
    let config = {
      // Default Development/Local Config (Used if NODE_ENV is not 'production')
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'vybeztribe',
      password: process.env.DB_PASS || 'dere84ELIJOOH',
      port: process.env.DB_PORT || 5432,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
      allowExitOnIdle: false
    };

    // === CPANEL PRODUCTION OVERRIDE (HARDCODED FIX) ===
    if (process.env.NODE_ENV === 'production') {
      console.log('Using CPANEL Production Configuration...');
      config = {
        // Hardcoded, confirmed credentials for a stable connection
        user: process.env.DB_USER || 'Karisdev2025',
        host: process.env.DB_HOST || '127.0.0.1', // CRITICAL: Use 127.0.0.1 for internal reliability
        database: process.env.DB_NAME || 'vybeztribe',
        password: process.env.DB_PASS || 'dere84ELIJOOH', // Your password
        port: process.env.DB_PORT || 5432,
        
        // SSL removed: Internal CPANEL PostgreSQL connections often fail when SSL is enabled
        
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 20,
        allowExitOnIdle: false
      };
    }
    // ============================================

    // Use connection string if provided (e.g., from a service like Render or Heroku)
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
    } else {
      // Use the determined config (local or CPANEL override)
      pool = new Pool(config);
    }

    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    pool.on('connect', (client) => {
      console.log('New database connection established');
    });

    pool.on('remove', () => {
      console.log('Database connection removed from pool');
    });
  }
  return pool;
};

const getPool = () => {
  return createPool();
};

const testConnection = async () => {
  try {
    const poolInstance = getPool();
    const client = await poolInstance.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();
    console.log('Database connection successful:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
};

const query = async (text, params) => {
  const poolInstance = getPool();
  return poolInstance.query(text, params);
};

process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

module.exports = {
  getPool,
  closePool,
  testConnection,
  query,
  pool: () => getPool()
};
