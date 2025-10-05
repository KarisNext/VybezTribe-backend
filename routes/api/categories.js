// backend/routes/api/categories.js

const express = require('express');
const { getPool } = require('../../config/db');
const router = express.Router();

router.get('/slugs', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT slug FROM categories WHERE active = true ORDER BY name',
      []
    );
    res.json(result.rows.map(row => row.slug));
  } catch (error) {
    console.error('Error fetching category slugs:', error);
    res.json(['politics', 'counties', 'opinion', 'business', 'sports', 'technology']);
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const pool = getPool();
    const { slug } = req.params;
    
    const categoryQuery = `
      SELECT category_id, name, slug, description, color, icon, active
      FROM categories 
      WHERE slug = $1 AND active = true
    `;
    
    const categoryResult = await pool.query(categoryQuery, [slug]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`
      });
    }
    
    const category = categoryResult.rows[0];
    
    return res.json({
      success: true,
      category: category
    });

  } catch (error) {
    console.error(`Category details error for ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:slug/news', async (req, res) => {
  try {
    const pool = getPool();
    const { slug } = req.params;
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;
    
    const categoryQuery = `
      SELECT category_id, name, slug, description, color, icon, active
      FROM categories 
      WHERE slug = $1 AND active = true
    `;
    
    const categoryResult = await pool.query(categoryQuery, [slug]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`
      });
    }
    
    const category = categoryResult.rows[0];
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news n
      WHERE n.category_id = $1 AND n.status = 'published'
    `;
    
    const countResult = await pool.query(countQuery, [category.category_id]);
    const totalNews = parseInt(countResult.rows[0].total);
    
    const newsQuery = `
      SELECT 
        n.news_id,
        n.title,
        n.excerpt,
        n.slug,
        n.category_id,
        n.featured,
        n.image_url,
        n.status,
        n.priority,
        n.tags,
        n.reading_time,
        n.views,
        n.likes_count,
        n.comments_count,
        n.share_count,
        n.published_at,
        n.created_at,
        n.updated_at,
        COALESCE(a.first_name, 'VybesTribe') as first_name,
        COALESCE(a.last_name, 'Editor') as last_name,
        a.email as author_email,
        c.name as category_name,
        c.slug as category_slug
      FROM news n
      LEFT JOIN admins a ON n.author_id = a.admin_id
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.category_id = $1 AND n.status = 'published'
      ORDER BY n.published_at DESC
      OFFSET $2 LIMIT $3
    `;
    
    const newsResult = await pool.query(newsQuery, [category.category_id, offset, limit]);
    
    const totalPages = Math.ceil(totalNews / limit);
    
    return res.json({
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
    console.error(`Category news error for ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:slug/featured', async (req, res) => {
  try {
    const pool = getPool();
    const { slug } = req.params;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    
    const categoryQuery = `
      SELECT category_id FROM categories WHERE slug = $1 AND active = true
    `;
    
    const categoryResult = await pool.query(categoryQuery, [slug]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`
      });
    }
    
    const categoryId = categoryResult.rows[0].category_id;
    
    const newsQuery = `
      SELECT 
        n.news_id,
        n.title,
        n.excerpt,
        n.slug,
        n.image_url,
        n.published_at,
        n.reading_time,
        n.views,
        n.likes_count,
        COALESCE(a.first_name, 'VybesTribe') as first_name,
        COALESCE(a.last_name, 'Editor') as last_name,
        c.name as category_name,
        c.slug as category_slug
      FROM news n
      LEFT JOIN admins a ON n.author_id = a.admin_id
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.category_id = $1 AND n.status = 'published' AND n.featured = true
      ORDER BY n.published_at DESC
      LIMIT $2
    `;
    
    const newsResult = await pool.query(newsQuery, [categoryId, limit]);
    
    return res.json({
      success: true,
      featured_news: newsResult.rows,
      category_slug: slug,
      total: newsResult.rows.length
    });

  } catch (error) {
    console.error(`Category featured error for ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:slug/trending', async (req, res) => {
  try {
    const pool = getPool();
    const { slug } = req.params;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10')));
    
    const categoryQuery = `
      SELECT category_id FROM categories WHERE slug = $1 AND active = true
    `;
    
    const categoryResult = await pool.query(categoryQuery, [slug]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`
      });
    }
    
    const categoryId = categoryResult.rows[0].category_id;
    
    const newsQuery = `
      SELECT 
        n.news_id,
        n.title,
        n.excerpt,
        n.slug,
        n.image_url,
        n.published_at,
        n.reading_time,
        n.views,
        n.likes_count,
        COALESCE(a.first_name, 'VybesTribe') as first_name,
        COALESCE(a.last_name, 'Editor') as last_name,
        c.name as category_name,
        c.slug as category_slug
      FROM news n
      LEFT JOIN admins a ON n.author_id = a.admin_id
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.category_id = $1 
        AND n.status = 'published' 
        AND n.published_at >= NOW() - INTERVAL '7 days'
      ORDER BY COALESCE(n.views, 0) DESC, n.published_at DESC
      LIMIT $2
    `;
    
    const newsResult = await pool.query(newsQuery, [categoryId, limit]);
    
    return res.json({
      success: true,
      trending_news: newsResult.rows,
      category_slug: slug,
      total: newsResult.rows.length
    });

  } catch (error) {
    console.error(`Category trending error for ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:slug/stats', async (req, res) => {
  try {
    const pool = getPool();
    const { slug } = req.params;
    
    const categoryQuery = `
      SELECT category_id FROM categories WHERE slug = $1 AND active = true
    `;
    
    const categoryResult = await pool.query(categoryQuery, [slug]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Category '${slug}' not found`
      });
    }
    
    const categoryId = categoryResult.rows[0].category_id;
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_articles,
        COUNT(*) FILTER (WHERE status = 'published') as published_articles,
        COUNT(*) FILTER (WHERE featured = true AND status = 'published') as featured_articles,
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '7 days' AND status = 'published') as articles_this_week,
        COUNT(*) FILTER (WHERE published_at >= NOW() - INTERVAL '30 days' AND status = 'published') as articles_this_month,
        COALESCE(SUM(views), 0) as total_views,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(AVG(reading_time), 0) as avg_reading_time
      FROM news
      WHERE category_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [categoryId]);
    
    return res.json({
      success: true,
      category_slug: slug,
      stats: statsResult.rows[0]
    });

  } catch (error) {
    console.error(`Category stats error for ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;