// backend/app.js - COMPLETE FIXED VERSION FOR RENDER
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
require('dotenv').config();

const { getPool, testConnection } = require('./config/db');

const app = express();

// Test database connection on startup
testConnection().then(connected => {
  if (!connected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }
  console.log('✅ Database connected successfully');
}).catch(err => {
  console.error('❌ Database connection error:', err);
  process.exit(1);
});

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://vybeztribe.com', 
      'https://www.vybeztribe.com',
      process.env.FRONTEND_URL
    ].filter(Boolean)
  : [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://127.0.0.1:3000',
      'http://localhost:3001'
    ];

console.log('🌐 Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.error('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Trust proxy - CRITICAL for Render deployment
app.set('trust proxy', 1);

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// SESSION CONFIGURATION
// ============================================

// Admin Session Store
const adminSessionStore = new pgSession({
  pool: getPool(),
  tableName: 'admin_session_store',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15 // Clean up expired sessions every 15 minutes
});

// Public/Client Session Store
const publicSessionStore = new pgSession({
  pool: getPool(),
  tableName: 'public_session_store',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15
});

// Admin Session Middleware
const adminSessionMiddleware = session({
  store: adminSessionStore,
  secret: process.env.SESSION_SECRET || 'vybeztribe-admin-secret-2024-secure',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  },
  name: 'vybeztribe_admin_session',
  rolling: true,
  proxy: true
});

// Public/Client Session Middleware
const publicSessionMiddleware = session({
  store: publicSessionStore,
  secret: process.env.SESSION_SECRET || 'vybeztribe-public-secret-2024-secure',
  resave: false,
  saveUninitialized: true, // Create session for anonymous users
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
// MOUNT ROUTES WITH PROPER SESSION MIDDLEWARE
// ============================================

// Admin routes - use admin session
app.use('/api/admin/auth', adminSessionMiddleware, authRoutes);
app.use('/api/admin/users', adminSessionMiddleware, usersRoutes);
app.use('/api/retrieve', adminSessionMiddleware, retrieveRoutes);

// Client routes - use public session
app.use('/api/client/auth', publicSessionMiddleware, clientAuthRoutes);

// Public API routes - no session required
app.use('/api/news', newsRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/categories', categoriesRoutes);

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
        'POST /api/client/auth/anonymous',
        'GET /api/client/auth/verify',
        'POST /api/client/auth/refresh',
        'POST /api/client/auth/logout'
      ],
      admin: [
        'POST /api/admin/auth/login',
        'GET /api/admin/auth/verify',
        'POST /api/admin/auth/logout',
        'POST /api/admin/auth/refresh'
      ],
      public: [
        'GET /api/articles/:slug',
        'GET /api/categories/:slug',
        'GET /api/news/category/:slug'
      ]
    }
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  
  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  res.status(err.status || 500).json({
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
  console.log('🚀 VybesTribe Backend Server');
  console.log('========================================');
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`💾 Database: ${process.env.DB_NAME || 'vybeztribe'}`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log('\n🔐 Admin Routes:');
  console.log('  POST /api/admin/auth/login');
  console.log('  GET  /api/admin/auth/verify');
  console.log('  POST /api/admin/auth/logout');
  console.log('\n👤 Client Routes:');
  console.log('  POST /api/client/auth/anonymous');
  console.log('  GET  /api/client/auth/verify');
  console.log('  POST /api/client/auth/logout');
  console.log('\n✅ Health: /health');
  console.log('✅ Test: /api/test');
  console.log('========================================\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    getPool().end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = app;
