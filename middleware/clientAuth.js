// backend/routes/client/auth.js
const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

router.post("/anonymous", async (req, res) => {
  try {
    // Express-session will automatically create and manage the session
    // We just need to mark it as an anonymous session
    req.session.isAnonymous = true;
    req.session.createdAt = new Date().toISOString();
    req.session.userAgent = req.headers['user-agent'] || 'Unknown';
    req.session.ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

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

  } catch (error) {
    console.error('Anonymous session creation error:', error);
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: generateCSRFToken(),
      message: 'Session creation failed'
    });
  }
});

router.get("/verify", async (req, res) => {
  try {
    console.log('Client session verification:', {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      isAnonymous: req.session?.isAnonymous
    });

    // If no session exists, express-session will create one automatically
    // since saveUninitialized is true for client sessions
    if (!req.session.id) {
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: generateCSRFToken(),
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

    return res.json({
      success: true,
      isAuthenticated: true,
      isAnonymous: req.session.isAnonymous !== false,
      user: req.session.userId ? await getUserData(req.session.userId) : null,
      client_id: req.session.id,
      csrf_token: csrfToken,
      message: 'Session verified'
    });

  } catch (error) {
    console.error('Client session verification error:', error);
    return res.status(500).json({
      success: false,
      isAuthenticated: false,
      isAnonymous: true,
      user: null,
      client_id: null,
      csrf_token: generateCSRFToken(),
      message: 'Verification failed'
    });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    console.log('Client session refresh:', {
      hasSession: !!req.session,
      sessionId: req.session?.id
    });
    
    if (!req.session.id) {
      return res.status(401).json({
        success: false,
        message: 'No session to refresh'
      });
    }

    // Express-session will automatically extend the session
    // We just need to update our timestamp
    req.session.lastRefresh = new Date().toISOString();
    const csrfToken = generateCSRFToken();
    req.session.csrfToken = csrfToken;

    return res.json({
      success: true,
      client_id: req.session.id,
      csrf_token: csrfToken,
      message: 'Session refreshed'
    });

  } catch (error) {
    console.error('Client session refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Refresh failed'
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    console.log('Client session logout:', {
      sessionId: req.session?.id
    });
    
    req.session.destroy(err => {
      if (err) {
        console.error('Client session destroy error:', err);
        return res.json({
          success: true,
          message: 'Session cleared locally'
        });
      }
      
      return res.json({
        success: true,
        message: 'Session terminated'
      });
    });

  } catch (error) {
    console.error('Client logout error:', error);
    return res.json({
      success: true,
      message: 'Session cleared'
    });
  }
});

const getUserData = async (userId) => {
  try {
    const { getPool } = require('../../config/db');
    const pool = getPool();
    const result = await pool.query(
      'SELECT client_id as id, email, first_name, last_name, role FROM clients WHERE client_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

module.exports = router;