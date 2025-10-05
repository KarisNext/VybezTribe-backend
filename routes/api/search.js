// C:\Projects\VybezTribe\backend\routes\api\search.js
const express = require('express');
const { getPool } = require('../../config/db');
const router = express.Router();

// Real-time search endpoint with fuzzy matching
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { q, limit = '10', categories, sort = 'relevance' } = req.query;
    
    // Validate query
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        results: [],
        total: 0,
        query: ''
      });
    }

    const searchQuery = q.trim();
    const searchLimit = Math.min(50, Math.max(1, parseInt(limit)));
    
    // Build category filter
    let categoryFilter = '';
    let queryParams = [searchQuery, searchLimit];
    
    if (categories && categories.trim()) {
      const categoryArray = categories.split(',').map(c => c.trim());
      categoryFilter = `AND c.slug = ANY($3)`;
      queryParams.push(categoryArray);
    }

    // Build sort clause
    let sortClause = '';
    switch (sort) {
      case 'recent':
        sortClause = 'ORDER BY n.published_at DESC';
        break;
      case 'popular':
        sortClause = 'ORDER BY n.views DESC, n.published_at DESC';
        break;
      case 'relevance':
      default:
        sortClause = `ORDER BY 
          ts_rank(
            to_tsvector('english', n.title || ' ' || n.excerpt || ' ' || COALESCE(n.tags, '')),
            plainto_tsquery('english', $1)
          ) DESC,
          n.published_at DESC`;
        break;
    }

    // Main search query with full-text search
    const searchSQL = `
      SELECT 
        n.news_id,
        n.title,
        n.excerpt,
        n.slug,
        n.category_id,
        n.featured,
        n.image_url,
        n.tags,
        n.reading_time,
        n.views,
        n.likes_count,
        n.comments_count,
        n.published_at,
        COALESCE(a.first_name, 'VybesTribe') as first_name,
        COALESCE(a.last_name, 'Editor') as last_name,
        c.name as category_name,
        c.slug as category_slug,
        ts_rank(
          to_tsvector('english', n.title || ' ' || n.excerpt || ' ' || COALESCE(n.tags, '')),
          plainto_tsquery('english', $1)
        ) as relevance_score
      FROM news n
      LEFT JOIN admins a ON n.author_id = a.admin_id
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.status = 'published'
        AND (
          to_tsvector('english', n.title || ' ' || n.excerpt || ' ' || COALESCE(n.tags, '')) @@ plainto_tsquery('english', $1)
          OR n.title ILIKE '%' || $1 || '%'
          OR n.excerpt ILIKE '%' || $1 || '%'
          OR n.tags ILIKE '%' || $1 || '%'
        )
        ${categoryFilter}
      ${sortClause}
      LIMIT $2
    `;

    const results = await pool.query(searchSQL, queryParams);

    // Get total count for the query
    const countSQL = `
      SELECT COUNT(*) as total
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.status = 'published'
        AND (
          to_tsvector('english', n.title || ' ' || n.excerpt || ' ' || COALESCE(n.tags, '')) @@ plainto_tsquery('english', $1)
          OR n.title ILIKE '%' || $1 || '%'
          OR n.excerpt ILIKE '%' || $1 || '%'
          OR n.tags ILIKE '%' || $1 || '%'
        )
        ${categoryFilter}
    `;

    const countParams = categoryFilter ? [searchQuery, categoryArray] : [searchQuery];
    const countResult = await pool.query(countSQL, countParams);
    
    return res.json({
      success: true,
      results: results.rows,
      total: parseInt(countResult.rows[0].total),
      query: searchQuery,
      sort: sort,
      categories: categories || null
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Search suggestions endpoint (for autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const pool = getPool();
    const { q, limit = '5' } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const searchQuery = q.trim();
    const searchLimit = Math.min(10, Math.max(1, parseInt(limit)));

    const suggestionsSQL = `
      SELECT DISTINCT
        n.title,
        n.slug,
        c.name as category_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.status = 'published'
        AND n.title ILIKE $1 || '%'
      ORDER BY n.views DESC, n.published_at DESC
      LIMIT $2
    `;

    const results = await pool.query(suggestionsSQL, [searchQuery, searchLimit]);
    
    return res.json({
      success: true,
      suggestions: results.rows
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions',
      error: error.message
    });
  }
});

// Popular searches endpoint
router.get('/popular', async (req, res) => {
  try {
    const pool = getPool();
    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit || '5')));

    // Get most popular tags as search suggestions
    const popularSQL = `
      SELECT 
        unnest(string_to_array(tags, ',')) as search_term,
        COUNT(*) as frequency
      FROM news
      WHERE status = 'published' 
        AND tags IS NOT NULL 
        AND tags != ''
      GROUP BY search_term
      ORDER BY frequency DESC
      LIMIT $1
    `;

    const results = await pool.query(popularSQL, [limit]);
    
    return res.json({
      success: true,
      popular: results.rows.map(r => r.search_term.trim())
    });

  } catch (error) {
    console.error('Popular searches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch popular searches',
      error: error.message
    });
  }
});

module.exports = router;