// backend/routes/api/news.js - Simplified and Fixed
const express = require('express');
const router = express.Router();

// Try to import database config
let dbModule = null;
let dbError = null;

try {
  dbModule = require('../../config/db');
  console.log('Database module loaded successfully');
} catch (error) {
  dbError = error.message;
  console.error('Failed to load database module:', error.message);
}

// Helper function to build news query
const getNewsQuery = (whereClause = '', orderBy = 'n.published_at DESC', limit = null) => {
  let query = `
    SELECT 
      n.news_id,
      n.title,
      n.content,
      n.excerpt,
      n.slug,
      n.category_id,
      n.status,
      n.priority,
      n.tags,
      n.reading_time,
      n.views,
      n.likes_count,
      n.comments_count,
      n.featured,
      n.youtube_url,
      n.youtube_id,
      n.youtube_title,
      n.youtube_thumbnail,
      n.published_at,
      n.created_at,
      n.updated_at,
      n.image_url,
      COALESCE(n.share_count, 0) as share_count,
      c.name as category_name,
      c.slug as category_slug,
      u.first_name,
      u.last_name,
      u.email as author_email
    FROM news n
    LEFT JOIN categories c ON n.category_id = c.category_id
    LEFT JOIN users u ON n.author_id = u.user_id
  `;
  
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }
  
  query += ` ORDER BY ${orderBy}`;
  
  if (limit) {
    query += ` LIMIT ${limit}`;
  }
  
  return query;
};

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'News API is working',
    timestamp: new Date().toISOString(),
    database_status: dbModule ? 'connected' : 'error',
    database_error: dbError
  });
});

// Get single article by slug
router.get('/article/:slug', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const { slug } = req.params;
    
    console.log('Fetching article:', slug);
    
    // Get main article
    const articleQuery = getNewsQuery(
      `n.slug = $1 AND n.status = 'published'`
    );
    
    const articleResult = await pool.query(articleQuery, [slug]);
    
    if (articleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    const article = articleResult.rows[0];
    
    // Get related articles from same category (excluding current article)
    const relatedQuery = getNewsQuery(
      `n.category_id = $1 AND n.news_id != $2 AND n.status = 'published'`,
      'n.published_at DESC',
      10
    );
    
    const relatedResult = await pool.query(relatedQuery, [
      article.category_id, 
      article.news_id
    ]);
    
    // Update view count
    try {
      await pool.query(
        'UPDATE news SET views = COALESCE(views, 0) + 1 WHERE news_id = $1', 
        [article.news_id]
      );
      article.views = (article.views || 0) + 1;
    } catch (viewError) {
      console.error('Error updating view count:', viewError);
    }
    
    res.json({
      success: true,
      article: article,
      related_articles: relatedResult.rows,
      comments: []
    });

  } catch (error) {
    console.error('Article fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message
    });
  }
});

// Main news endpoint
router.get('/', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError,
      news: []
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    
    // Parse query parameters
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim();
    const status = req.query.status || 'published';
    const sort = req.query.sort || 'published_at';
    const order = (req.query.order || 'DESC').toUpperCase();
    
    console.log('News query params:', { page, limit, search, status, sort, order });
    
    // Build where conditions
    let whereConditions = [`n.status = $1`];
    let queryParams = [status];
    let paramIndex = 1;
    
    if (search) {
      paramIndex++;
      whereConditions.push(`(
        n.title ILIKE $${paramIndex} OR 
        n.content ILIKE $${paramIndex} OR 
        n.excerpt ILIKE $${paramIndex} OR
        n.tags ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count first
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news n
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const totalNews = parseInt(countResult.rows[0].total);
    
    // Get news with pagination
    const newsQuery = getNewsQuery(
      whereClause, 
      `n.${sort} ${order}`
    ) + ` OFFSET $${paramIndex + 1} LIMIT $${paramIndex + 2}`;
    
    queryParams.push(offset, limit);
    
    const newsResult = await pool.query(newsQuery, queryParams);
    
    const totalPages = Math.ceil(totalNews / limit);
    
    res.json({
      success: true,
      news: newsResult.rows,
      pagination: {
        current_page: page,
        per_page: limit,
        total_news: totalNews,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news',
      error: error.message,
      news: []
    });
  }
});

// Categories endpoint
router.get('/categories', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError,
      categories: []
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT 
        c.category_id,
        c.name,
        c.slug,
        c.description,
        c.color,
        c.icon,
        c.active,
        COALESCE(c.order_index, 999) as order_index,
        COUNT(n.news_id) as news_count
      FROM categories c
      LEFT JOIN news n ON c.category_id = n.category_id AND n.status = 'published'
      WHERE c.active = true
      GROUP BY c.category_id, c.name, c.slug, c.description, c.color, c.icon, c.active, c.order_index
      ORDER BY COALESCE(c.order_index, 999) ASC, c.name ASC
    `);
    
    res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
      categories: []
    });
  }
});

// Category-specific news
router.get('/category/:slug', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError,
      news: []
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const { slug } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;
    
    console.log('Category news query:', { slug, page, limit });
    
    // Get category info first
    const categoryResult = await pool.query(`
      SELECT category_id, name, slug, description, color, icon, active
      FROM categories 
      WHERE slug = $1 AND active = true
    `, [slug]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`,
        news: []
      });
    }
    
    const category = categoryResult.rows[0];
    
    // Get total count for this category
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM news n
      WHERE n.category_id = $1 AND n.status = 'published'
    `, [category.category_id]);
    
    const totalNews = parseInt(countResult.rows[0].total);
    
    // Get category news
    const newsQuery = getNewsQuery(
      `n.category_id = $1 AND n.status = 'published'`,
      'n.published_at DESC'
    ) + ` OFFSET $2 LIMIT $3`;
    
    const newsResult = await pool.query(newsQuery, [
      category.category_id, 
      offset, 
      limit
    ]);
    
    const totalPages = Math.ceil(totalNews / limit);
    
    res.json({
      success: true,
      category: category,
      news: newsResult.rows,
      pagination: {
        current_page: page,
        per_page: limit,
        total_news: totalNews,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Category news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category news',
      error: error.message,
      news: []
    });
  }
});

// Breaking news
router.get('/breaking', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError,
      breaking_news: []
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    
    // Use high priority or featured articles as breaking news
    const newsQuery = getNewsQuery(
      `n.status = 'published' AND (n.priority = 'high' OR n.featured = true)`,
      'n.published_at DESC',
      limit
    );
    
    const result = await pool.query(newsQuery);
    
    res.json({
      success: true,
      breaking_news: result.rows,
      news: result.rows, // Also include as 'news' for compatibility
      total: result.rows.length
    });

  } catch (error) {
    console.error('Breaking news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch breaking news',
      error: error.message,
      breaking_news: []
    });
  }
});

// Featured news
router.get('/featured', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError,
      featured_news: []
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    
    const newsQuery = getNewsQuery(
      `n.status = 'published' AND n.featured = true`,
      'n.published_at DESC',
      limit
    );
    
    const result = await pool.query(newsQuery);
    
    res.json({
      success: true,
      featured_news: result.rows,
      news: result.rows, // Also include as 'news' for compatibility
      total: result.rows.length
    });

  } catch (error) {
    console.error('Featured news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured news',
      error: error.message,
      featured_news: []
    });
  }
});

// Trending news
router.get('/trending', async (req, res) => {
  if (!dbModule) {
    return res.status(500).json({
      success: false,
      message: 'Database not available',
      error: dbError,
      trending_news: []
    });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    
    // Get trending news from last 7 days, sorted by views
    const newsQuery = getNewsQuery(
      `n.status = 'published' AND n.published_at >= NOW() - INTERVAL '7 days'`,
      'COALESCE(n.views, 0) DESC, n.published_at DESC',
      limit
    );
    
    const result = await pool.query(newsQuery);
    
    res.json({
      success: true,
      trending_news: result.rows,
      news: result.rows, // Also include as 'news' for compatibility
      total: result.rows.length
    });

  } catch (error) {
    console.error('Trending news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending news',
      error: error.message,
      trending_news: []
    });
  }
});

// View tracking
router.post('/view/:id', async (req, res) => {
  if (!dbModule) {
    return res.json({ success: false, message: 'Database not available' });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const { id } = req.params;
    
    await pool.query(
      'UPDATE news SET views = COALESCE(views, 0) + 1 WHERE news_id = $1', 
      [parseInt(id)]
    );
    
    res.json({ success: true, message: 'View tracked' });

  } catch (error) {
    console.error('View tracking error:', error);
    res.json({ success: false, message: 'Failed to track view' });
  }
});

// Like article
router.post('/like/:id', async (req, res) => {
  if (!dbModule) {
    return res.json({ success: false, message: 'Database not available' });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE news SET likes_count = COALESCE(likes_count, 0) + 1 WHERE news_id = $1 RETURNING likes_count', 
      [parseInt(id)]
    );
    
    res.json({
      success: true,
      likes_count: result.rows[0]?.likes_count || 0,
      message: 'Article liked'
    });

  } catch (error) {
    console.error('Like error:', error);
    res.json({ success: false, message: 'Failed to like article' });
  }
});

// Share article
router.post('/share/:id', async (req, res) => {
  if (!dbModule) {
    return res.json({ success: false, message: 'Database not available' });
  }

  try {
    const { getPool } = dbModule;
    const pool = getPool();
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE news SET share_count = COALESCE(share_count, 0) + 1 WHERE news_id = $1 RETURNING share_count', 
      [parseInt(id)]
    );
    
    res.json({
      success: true,
      share_count: result.rows[0]?.share_count || 0,
      message: 'Article shared'
    });

  } catch (error) {
    console.error('Share error:', error);
    res.json({ success: false, message: 'Failed to share article' });
  }
});

module.exports = router;