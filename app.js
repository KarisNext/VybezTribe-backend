// backend/app.js - Fixed for Render Deployment
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
require('dotenv').config();

const { getPool, testConnection } = require('./config/db');

const app = express();

// Test database connection
testConnection().then(connected => {
  if (!connected) {
    console.error('Failed to connect to database.');
    process.exit(1);
  }
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// FIXED CORS configuration for Render
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://vybeztribe.com', 
      'https://www.vybeztribe.com',
      'https://vybeztribe-frontend.onrender.com', // Add your actual Render frontend URL
      process.env.FRONTEND_URL
    ].filter(Boolean)
  : [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    ];

console.log('Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    console.log('Request Origin:', origin); // Debug logging
    
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Trust proxy for Render deployment - CRITICAL for sessions
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// FIXED Session middleware for admin
const adminSessionMiddleware = session({
  store: new pgSession({
    pool: getPool(),
    tableName: 'admin_session_store',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'vybeztribe-admin-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin
    path: '/'
  },
  name: 'vybeztribe_admin_session',
  rolling: true,
  proxy: true // IMPORTANT: Trust the reverse proxy
});

// FIXED Session middleware for public/client
const publicSessionMiddleware = session({
  store: new pgSession({
    pool: getPool(),
    tableName: 'public_session_store',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'vybeztribe-public-secret-2024',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  },
  name: 'vybeztribe_public_session',
  rolling: true,
  proxy: true
});

// ============================================
// CLIENT API ROUTE HANDLERS
// ============================================

// Client category route handler
const handleClientCategory = async (req, res) => {
  try {
    const { slug, type = 'news', page = 1, limit = 20 } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Category slug is required'
      });
    }

    const pool = getPool();
    
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
    
    if (type === 'news') {
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;
      
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
      
      const newsResult = await pool.query(newsQuery, [category.category_id, offset, limitNum]);
      
      const totalPages = Math.ceil(totalNews / limitNum);
      
      return res.json({
        success: true,
        category: category,
        news: newsResult.rows,
        pagination: {
          current_page: pageNum,
          per_page: limitNum,
          total_news: totalNews,
          total_pages: totalPages,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1
        }
      });
    } else if (type === 'stats') {
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
      
      const statsResult = await pool.query(statsQuery, [category.category_id]);
      
      return res.json({
        success: true,
        category: category,
        stats: statsResult.rows[0]
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid type parameter. Use "news" or "stats"'
      });
    }
  } catch (error) {
    console.error('Client category API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Client home route handler
const handleClientHome = async (req, res) => {
  try {
    const { type = 'all', limit = 10 } = req.query;
    const pool = getPool();
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    
    if (type === 'breaking') {
      const breakingQuery = `
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
        WHERE n.status = 'published' AND (n.priority = 'high' OR n.featured = true)
        ORDER BY n.published_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(breakingQuery, [limitNum]);
      
      return res.json({
        success: true,
        breaking_news: result.rows
      });
    } else if (type === 'featured') {
      const featuredQuery = `
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
        WHERE n.status = 'published' AND n.featured = true
        ORDER BY n.published_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(featuredQuery, [limitNum]);
      
      return res.json({
        success: true,
        featured_news: result.rows
      });
    } else if (type === 'trending') {
      const trendingQuery = `
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
        WHERE n.status = 'published' AND n.published_at >= NOW() - INTERVAL '7 days'
        ORDER BY COALESCE(n.views, 0) DESC, n.published_at DESC
        LIMIT $1
      `;
      
      const result = await pool.query(trendingQuery, [limitNum]);
      
      return res.json({
        success: true,
        trending_news: result.rows
      });
    } else if (type === 'categories') {
      const categoriesQuery = `
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
      `;
      
      const result = await pool.query(categoriesQuery);
      
      return res.json({
        success: true,
        categories: result.rows
      });
    } else {
      const baseQuery = `
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
          n.featured,
          n.priority,
          COALESCE(a.first_name, 'VybesTribe') as first_name,
          COALESCE(a.last_name, 'Editor') as last_name,
          c.name as category_name,
          c.slug as category_slug
        FROM news n
        LEFT JOIN admins a ON n.author_id = a.admin_id
        LEFT JOIN categories c ON n.category_id = c.category_id
        WHERE n.status = 'published'
      `;
      
      const [breakingResult, featuredResult, trendingResult, categoriesResult] = await Promise.all([
        pool.query(`${baseQuery} AND (n.priority = 'high' OR n.featured = true) ORDER BY n.published_at DESC LIMIT 10`),
        pool.query(`${baseQuery} AND n.featured = true ORDER BY n.published_at DESC LIMIT 10`),
        pool.query(`${baseQuery} AND n.published_at >= NOW() - INTERVAL '7 days' ORDER BY COALESCE(n.views, 0) DESC LIMIT 10`),
        pool.query(`SELECT * FROM categories WHERE active = true ORDER BY COALESCE(order_index, 999) ASC`)
      ]);
      
      const categoryPreviews = {};
      const mainCategories = ['politics', 'counties', 'opinion', 'business', 'sports', 'technology'];
      
      for (const categorySlug of mainCategories) {
        const previewQuery = `
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
          WHERE c.slug = $1 AND n.status = 'published'
          ORDER BY n.published_at DESC
          LIMIT 6
        `;
        
        const previewResult = await pool.query(previewQuery, [categorySlug]);
        categoryPreviews[categorySlug] = previewResult.rows;
      }
      
      return res.json({
        success: true,
        breaking_news: breakingResult.rows,
        featured_news: featuredResult.rows,
        trending_news: trendingResult.rows,
        categories: categoriesResult.rows,
        category_previews: categoryPreviews
      });
    }
  } catch (error) {
    console.error('Client home API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Client article route handler
const handleClientArticle = async (req, res) => {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Article slug is required'
      });
    }
    
    const pool = getPool();
    
    const articleQuery = `
      SELECT 
        n.*,
        COALESCE(a.first_name, 'VybesTribe') as first_name,
        COALESCE(a.last_name, 'Editor') as last_name,
        a.email as author_email,
        c.name as category_name,
        c.slug as category_slug,
        c.color as category_color,
        c.icon as category_icon
      FROM news n
      LEFT JOIN admins a ON n.author_id = a.admin_id
      LEFT JOIN categories c ON n.category_id = c.category_id
      WHERE n.slug = $1 AND n.status = 'published'
    `;
    
    const result = await pool.query(articleQuery, [slug]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    await pool.query(
      'UPDATE news SET views = COALESCE(views, 0) + 1 WHERE slug = $1',
      [slug]
    );
    
    return res.json({
      success: true,
      article: result.rows[0]
    });
  } catch (error) {
    console.error('Client article API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// IMPORT ROUTE MODULES
// ============================================
const newsRoutes = require('./routes/api/news.js');
const articlesRoutes = require('./routes/api/articles.js');
const categoriesRoutes = require('./routes/api/categories.js');
const authRoutes = require('./routes/admin/auth.js');
const usersRoutes = require('./routes/admin/user.js');
const retrieveRoutes = require('./routes/retrieve/retrieval.js');
const clientAuthRoutes = require('./routes/client/auth.js');

// ============================================
// MOUNT ROUTES
// ============================================

app.use('/api/admin/auth', adminSessionMiddleware, authRoutes);
app.use('/api/admin/users', adminSessionMiddleware, usersRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/retrieve', adminSessionMiddleware, retrieveRoutes);
app.use('/api/client/auth', publicSessionMiddleware, clientAuthRoutes);

app.get('/api/client/category', publicSessionMiddleware, handleClientCategory);
app.get('/api/client/home', publicSessionMiddleware, handleClientHome);
app.get('/api/client/article', publicSessionMiddleware, handleClientArticle);

app.get('/api/client/fetch', publicSessionMiddleware, async (req, res) => {
  const { type, ...params } = req.query;
  
  if (type === 'category' && params.slug) {
    return handleClientCategory(req, res);
  } else if (type === 'home') {
    return handleClientHome(req, res);
  } else if (type === 'article' && params.slug) {
    return handleClientArticle(req, res);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid fetch type or missing parameters'
    });
  }
});

// ============================================
// HEALTH & TEST ROUTES
// ============================================

app.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'Connected' : 'Disconnected',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'VybesTribe API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      client: [
        'GET /api/client/category?slug=:slug&type=news',
        'GET /api/client/home?type=:type',
        'GET /api/client/article?slug=:slug'
      ],
      public: [
        'GET /api/articles/:slug',
        'GET /api/categories/:slug',
        'GET /api/news/category/:slug'
      ],
      admin: [
        'POST /api/admin/auth/login',
        'GET /api/admin/users'
      ]
    }
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

app.use('/api/client/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n========================================');
  console.log('VybesTribe Backend Server');
  console.log('========================================');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`Database: ${process.env.DB_NAME || 'vybeztribe'}`);
  console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log('\nClient Routes Active:');
  console.log('  /api/client/category?slug=:slug');
  console.log('  /api/client/home?type=:type');
  console.log('  /api/client/article?slug=:slug');
  console.log('\nHealth Check: /health');
  console.log('Test Endpoint: /api/test');
  console.log('========================================\n');
});

module.exports = app;
