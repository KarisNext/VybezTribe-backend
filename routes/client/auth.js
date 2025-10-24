// backend/routes/client/auth.js - COMPLETE FIXED VERSION
const express = require('express');
const crypto = require('crypto');
const { getPool } = require('../../config/db');

const router = express.Router();

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ============================================
// CREATE ANONYMOUS SESSION
// ============================================
router.post('/anonymous', async (req, res) => {
  try {
    console.log('Creating anonymous session:', {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      userAgent: req.headers['user-agent']
    });

    // Initialize session data
    req.session.isAnonymous = true;
    req.session.createdAt = new Date().toISOString();
    req.session.userAgent = req.headers['user-agent'] || 'Unknown';
    req.session.ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Anonymous session save error:', err);
        return res.status(500).json({
          success: false,
          isAuthenticated: false,
          isAnonymous: true,
          user: null,
          client_id: null,
          csrf_token: null,
          message: 'Failed to create session'
        });
      }

      console.log('Anonymous session created:', {
        sessionId: req.session.id,
        isAnonymous: req.session.isAnonymous
      });

      return res.json({
        success: true,
        isAuthenticated: true,
        isAnonymous: true,
        user: null,
        client_id: req.session.id,
        csrf_token: csrfToken,
        message: 'Anonymous session created'
      });
    });

  } catch (error) {
    console.error('Anonymous session creation error:', error);
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: 'Session creation failed'
    });
  }
});

// ============================================
// VERIFY CLIENT SESSION
// ============================================
router.get('/verify', async (req, res) => {
  try {
    console.log('Client session verify:', {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      isAnonymous: req.session?.isAnonymous,
      hasUserId: !!req.session?.userId
    });

    // Check if session exists
    if (!req.session || !req.session.id) {
      console.log('No session found');
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: null,
        message: 'No session found'
      });
    }

    // Mark as anonymous if not already set
    if (req.session.isAnonymous === undefined) {
      req.session.isAnonymous = true;
      req.session.createdAt = new Date().toISOString();
    }

    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    // Get user data if userId exists
    let user = null;
    if (req.session.userId) {
      try {
        const pool = getPool();
        const result = await pool.query(
          'SELECT user_id as id, email, first_name, last_name FROM users WHERE user_id = $1 AND status = $2',
          [req.session.userId, 'active']
        );
        user = result.rows[0] || null;
        
        if (!user) {
          // User no longer exists or is inactive
          req.session.userId = null;
          req.session.isAnonymous = true;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    console.log('Client session verified:', {
      sessionId: req.session.id,
      isAnonymous: req.session.isAnonymous,
      hasUser: !!user
    });

    return res.json({
      success: true,
      isAuthenticated: true,
      isAnonymous: req.session.isAnonymous !== false,
      user: user,
      client_id: req.session.id,
      csrf_token: csrfToken,
      message: 'Session verified'
    });

  } catch (error) {
    console.error('Client session verify error:', error);
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: null,
      message: 'Verification failed'
    });
  }
});

// ============================================
// REFRESH CLIENT SESSION
// ============================================
router.post('/refresh', async (req, res) => {
  try {
    console.log('Client session refresh:', {
      hasSession: !!req.session,
      sessionId: req.session?.id
    });
    
    if (!req.session || !req.session.id) {
      return res.status(401).json({
        success: false,
        message: 'No session to refresh'
      });
    }

    // Update refresh timestamp
    req.session.lastRefresh = new Date().toISOString();
    req.session.touch();

    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    req.session.save((err) => {
      if (err) {
        console.error('Session refresh save error:', err);
        return res.status(500).json({
          success: false,
          message: 'Refresh failed'
        });
      }

      console.log('Client session refreshed:', req.session.id);

      return res.json({
        success: true,
        client_id: req.session.id,
        csrf_token: csrfToken,
        message: 'Session refreshed'
      });
    });

  } catch (error) {
    console.error('Client session refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Refresh failed'
    });
  }
});

// ============================================
// CLIENT LOGOUT
// ============================================
router.post('/logout', async (req, res) => {
  try {
    console.log('Client logout:', {
      sessionId: req.session?.id,
      userId: req.session?.userId
    });
    
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Client session destroy error:', err);
          return res.json({
            success: true,
            message: 'Session cleared locally'
          });
        }
        
        res.clearCookie('vybeztribe_public_session');
        
        console.log('Client session destroyed');
        
        return res.json({
          success: true,
          message: 'Session terminated'
        });
      });
    } else {
      return res.json({
        success: true,
        message: 'No session to logout'
      });
    }

  } catch (error) {
    console.error('Client logout error:', error);
    return res.json({
      success: true,
      message: 'Session cleared'
    });
  }
});

module.exports = router;
