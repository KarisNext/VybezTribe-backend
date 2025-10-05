const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('../config/db');

async function runMigration() {
  const pool = getPool();
  let client;

  try {
    client = await pool.connect();
    console.log('✅ Database connection established for migration.');

    const sqlFilePath = path.join(__dirname, 'alter_news_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Begin a database transaction to ensure all commands succeed or fail together
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('🚀 Migration successful! The news table has been updated.');

  } catch (err) {
    // If any command fails, rollback the entire transaction
    await client.query('ROLLBACK');
    console.error('❌ Migration failed! Rolling back changes.');
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await closePool();
  }
}

// Run the migration script
runMigration();