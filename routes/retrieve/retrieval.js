const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { getPool } = require('../../config/db');
    const pool = getPool();
    const {
      page = 1,
      limit = 12,
      status,
      category_id,
      priority,
      featured,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;
    if (status) {
      paramCount++;
      whereConditions.push(`n.status = $${paramCount}`);
      queryParams.push(status);
    }
    if (category_id) {
      paramCount++;
      whereConditions.push(`n.category_id = $${paramCount}`);
      queryParams.push(category_id);
    }
    if (priority) {
      paramCount++;
      whereConditions.push(`n.priority = $${paramCount}`);
      queryParams.push(priority);
    }
    if (featured === 'true') {
      whereConditions.push(`n.featured = true`);
    }
    if (search) {
      paramCount++;
      whereConditions.push(`(n.title ILIKE $${paramCount} OR n.content ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const newsQuery = `
      SELECT
        n.*,
        c.name as category_name,
        c.slug as category_slug,
        a.first_name,
        a.last_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.category_id
      LEFT JOIN admins a ON n.author_id = a.admin_id
      ${whereClause}
      ORDER BY n.${sort} ${order}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    queryParams.push(parseInt(limit), offset);
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news n
      ${whereClause}
    `;
    const statsQuery = `
      SELECT
        COUNT(*)::int as total_posts,
        COUNT(CASE WHEN status = 'published' THEN 1 END)::int as published_posts,
        COUNT(CASE WHEN status = 'draft' THEN 1 END)::int as draft_posts,
        COUNT(CASE WHEN status = 'archived' THEN 1 END)::int as archived_posts,
        COUNT(CASE WHEN featured = true THEN 1 END)::int as featured_posts,
        COALESCE(SUM(views), 0)::int as total_views,
        COALESCE(SUM(likes_count), 0)::int as total_likes,
        COALESCE(SUM(comments_count), 0)::int as total_comments
      FROM news n
    `;
    const [newsResult, countResult, statsResult] = await Promise.all([
      pool.query(newsQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(statsQuery)
    ]);
    const totalNews = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalNews / parseInt(limit));
    return res.json({
      success: true,
      news: newsResult.rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_news: totalNews,
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { getPool } = require('../../config/db');
    const pool = getPool();
    const { id } = req.params;
    const newsQuery = `
      SELECT
        n.*,
        c.name as category_name,
        c.slug as category_slug,
        a.first_name,
        a.last_name,
        a.email as author_email
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.category_id
      LEFT JOIN admins a ON n.author_id = a.admin_id
      WHERE n.news_id = $1
    `;
    const result = await pool.query(newsQuery, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }
    return res.json({
      success: true,
      news: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { getPool } = require('../../config/db');
    const pool = getPool();
    const { id } = req.params;
    const { author_id } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'News ID is required'
      });
    }
    const existingNews = await pool.query('SELECT * FROM news WHERE news_id = $1', [id]);
    if (existingNews.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }
    await pool.query('DELETE FROM news WHERE news_id = $1', [id]);
    if (author_id) {
      await pool.query(
        'INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          author_id,
          'delete_news',
          'news',
          id,
          `Deleted news: ${existingNews.rows[0].title}`,
          req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip
        ]
      );
    }
    return res.json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;