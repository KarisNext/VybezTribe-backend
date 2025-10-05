// updatecounties.js
const { getPool } = require('../config/db');

async function runCountiesCategoryMigration() {
  const pool = getPool();
  let client;

  try {
    client = await pool.connect();
    console.log('[OK] Connected to database');

    await client.query('BEGIN');

    // 1. Check if counties category exists
    console.log('[INFO] Checking for "counties" category...');
    const checkResult = await client.query(`
      SELECT category_id, name, slug, active FROM categories WHERE slug = 'counties';
    `);
    
    if (checkResult.rows.length === 0) {
      // Counties doesn't exist, create it
      console.log('[INFO] Creating "Counties" category...');
      const insertResult = await client.query(`
        INSERT INTO categories (name, slug, description, color, icon, order_index, active)
        VALUES ('Counties', 'counties', 'News and updates from counties across Kenya', '#16a34a', 'county', 2, true)
        RETURNING category_id, name, slug, active;
      `);
      console.log('[OK] Created category:', insertResult.rows[0]);
    } else {
      // Counties exists, ensure it's active and properly configured
      console.log('[INFO] Updating "Counties" category...');
      const updateResult = await client.query(`
        UPDATE categories 
        SET 
          name = 'Counties',
          description = 'News and updates from counties across Kenya',
          color = '#16a34a',
          icon = 'county',
          order_index = 2,
          active = true
        WHERE slug = 'counties'
        RETURNING category_id, name, slug, active;
      `);
      console.log('[OK] Updated category:', updateResult.rows[0]);
    }

    await client.query('COMMIT');

    // Verification
    console.log('[INFO] Verifying categories...');
    const verify = await client.query(`
      SELECT 
        c.category_id, 
        c.name, 
        c.slug, 
        c.active,
        c.description,
        c.color,
        c.icon,
        c.order_index,
        COUNT(n.news_id) as article_count
      FROM categories c
      LEFT JOIN news n ON c.category_id = n.category_id AND n.status = 'published'
      WHERE c.slug = 'counties'
      GROUP BY c.category_id;
    `);
    console.table(verify.rows);

    // Check for published articles
    if (verify.rows[0] && verify.rows[0].article_count > 0) {
      console.log(`[OK] Category has ${verify.rows[0].article_count} published articles`);
      
      // Show sample articles
      const sampleArticles = await client.query(`
        SELECT news_id, title, slug, status
        FROM news
        WHERE category_id = (SELECT category_id FROM categories WHERE slug = 'counties')
        AND status = 'published'
        LIMIT 5;
      `);
      console.log('\n[INFO] Sample articles:');
      console.table(sampleArticles.rows);
    } else {
      console.log('[WARN] No published articles found for counties category');
    }

    console.log('\n[SUCCESS] Migration complete!');

  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('[ERROR] Migration failed, rolled back');
    console.error(err);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
    console.log('[INFO] Database connection closed');
  }
}

// Run script
if (require.main === module) {
  console.log('[START] Counties Category Migration...');
  runCountiesCategoryMigration();
}

module.exports = { runCountiesCategoryMigration };