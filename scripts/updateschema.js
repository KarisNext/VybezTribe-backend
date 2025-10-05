// updateopinion.js
const { getPool } = require('../config/db');

async function runOpinionCategoryMigration() {
  const pool = getPool();
  let client;

  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    await client.query('BEGIN');

    // 1. Deactivate Arts
    console.log('🔄 Deactivating "Arts" category...');
    const deactivateResult = await client.query(`
      UPDATE categories SET active = FALSE WHERE slug = 'arts';
    `);
    console.log(`✅ Deactivated ${deactivateResult.rowCount} rows for slug 'arts'`);

    // 2. Insert Opinion
    console.log('🔄 Inserting "Opinion" category...');
    const insertResult = await client.query(`
      INSERT INTO categories (name, slug, description, color, icon, order_index, active)
      VALUES ('Opinion', 'opinion', 'Commentary and perspectives on current events and issues', '#ffa500', 'opinion', 7, true)
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log(`✅ Inserted ${insertResult.rowCount} new category 'Opinion'`);

    // 3. Reassign News Articles
    console.log('🔄 Reassigning news from Arts → Opinion...');
    const updateNewsResult = await client.query(`
      UPDATE news
      SET category_id = (SELECT category_id FROM categories WHERE slug = 'opinion')
      WHERE category_id = (SELECT category_id FROM categories WHERE slug = 'arts');
    `);
    console.log(`✅ Updated ${updateNewsResult.rowCount} news articles`);

    await client.query('COMMIT');

    // Verification
    console.log('🔍 Verifying categories...');
    const check = await client.query(`
      SELECT category_id, name, slug, active FROM categories WHERE slug IN ('arts', 'opinion');
    `);
    console.table(check.rows);

    console.log('🚀 Migration complete!');

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Migration failed, rolled back');
    console.error(err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await closePool();
    console.log('🔌 Database connection closed');
  }
}

// Run script
if (require.main === module) {
  console.log('🚀 Starting Opinion Category Migration...');
  runOpinionCategoryMigration();
}
