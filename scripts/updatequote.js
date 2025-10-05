// updatequote.js
const { getPool, closePool } = require('../config/db');

async function runQuotesMigration() {
  const pool = getPool();
  let client;

  try {
    client = await pool.connect();
    console.log('✅ Connected to database');

    await client.query('BEGIN');

    // 1. Insert "Quotes" category
    console.log('🔄 Inserting "Quotes" category...');
    const insertCategory = await client.query(`
      INSERT INTO categories (name, slug, description, color, icon, order_index, active)
      VALUES (
        'Quotes',
        'quotes',
        'Special category for featured quotes and highlighted statements',
        '#4b0082', -- Indigo color
        'quote',
        8,
        TRUE
      )
      ON CONFLICT (slug) DO NOTHING;
    `);
    console.log(`✅ Inserted ${insertCategory.rowCount} new category 'Quotes'`);

    // 2. Add new columns to news table
    console.log('🔄 Adding new columns to news table...');
    await client.query(`
      ALTER TABLE public.news
      ADD COLUMN IF NOT EXISTS processed_content TEXT;
    `);
    await client.query(`
      ALTER TABLE public.news
      ADD COLUMN IF NOT EXISTS quotes_data JSONB;
    `);

    // 3. Create index on quotes_data
    console.log('🔄 Creating index on quotes_data...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_news_quotes_data
      ON public.news USING GIN (quotes_data);
    `);

    // 4. Add comments
    await client.query(`
      COMMENT ON COLUMN public.news.processed_content IS
      'HTML-processed content where [QUOTE]...[/QUOTE] is replaced with <blockquote>';
    `);
    await client.query(`
      COMMENT ON COLUMN public.news.quotes_data IS
      'JSON array of extracted quotes with their text and optional metadata';
    `);

    await client.query('COMMIT');
    console.log('🚀 Quotes category + news columns migration complete!');

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
  console.log('🚀 Starting Quotes Migration...');
  runQuotesMigration();
}
