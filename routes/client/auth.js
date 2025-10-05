// backend/routes/client/auth.js
const express = require("express");
const crypto = require("crypto");
const { getPool } = require("../../config/db");

const router = express.Router();

const generateClientId = () => {
  return 'client_' + crypto.randomBytes(24).toString('hex') + '_' + Date.now();
};

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const validateClientSession = async (clientId) => {
  if (!clientId || !clientId.startsWith('client_')) return null;
  
  const pool = getPool();
  const result = await pool.query(
    'SELECT * FROM user_sessions WHERE session_id = $1 AND is_active = true AND expires_at > NOW()',
    [clientId]
  );
  return result.rows[0] || null;
};

router.post("/anonymous", async (req, res) => {
  try {
    const pool = getPool();
    const clientId = generateClientId();
    const csrfToken = generateCSRFToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    await pool.query(`
      INSERT INTO user_sessions (session_id, user_id, ip_address, user_agent, last_activity, created_at, expires_at, is_active) 
      VALUES ($1, NULL, $2, $3, NOW(), NOW(), $4, true)
    `, [clientId, ipAddress, userAgent, expiresAt]);

    res.cookie('vybeztribe_client_session', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === 'production' ? '.vybeztribe.com' : undefined,
    });

    console.log('Anonymous session created:', clientId);

    return res.json({
      success: true,
      isAuthenticated: true,
      isAnonymous: true,
      user: null,
      client_id: clientId,
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
    const pool = getPool();
    
    // Clean up expired sessions
    await pool.query(`
      UPDATE user_sessions 
      SET is_active = false 
      WHERE expires_at < NOW() AND is_active = true
    `);

    const clientId = req.cookies?.['vybeztribe_client_session'];
    
    console.log('Client session verification for:', clientId);
    
    if (!clientId) {
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

    const session = await validateClientSession(clientId);
    
    if (!session) {
      res.clearCookie('vybeztribe_client_session');
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        isAnonymous: true,
        user: null,
        client_id: null,
        csrf_token: generateCSRFToken(),
        message: 'Invalid session'
      });
    }

    // Update session activity
    await pool.query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE session_id = $1',
      [clientId]
    );

    console.log('Client session verified:', clientId);

    return res.json({
      success: true,
      isAuthenticated: true,
      isAnonymous: session.user_id === null,
      user: session.user_id ? await getUserData(session.user_id, pool) : null,
      client_id: clientId,
      csrf_token: generateCSRFToken(),
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
    const clientId = req.cookies?.['vybeztribe_client_session'];
    const pool = getPool();
    
    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: 'No session to refresh'
      });
    }

    const session = await validateClientSession(clientId);
    
    if (!session) {
      res.clearCookie('vybeztribe_client_session');
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'UPDATE user_sessions SET expires_at = $1, last_activity = NOW() WHERE session_id = $2',
      [newExpiry, clientId]
    );

    res.cookie('vybeztribe_client_session', clientId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.NODE_ENV === 'production' ? '.vybeztribe.com' : undefined,
    });

    console.log('Client session refreshed:', clientId);

    return res.json({
      success: true,
      client_id: clientId,
      csrf_token: generateCSRFToken(),
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
    const clientId = req.cookies?.['vybeztribe_client_session'];
    const pool = getPool();
    
    if (clientId) {
      await pool.query(
        'UPDATE user_sessions SET is_active = false WHERE session_id = $1',
        [clientId]
      );
      console.log('Client session deactivated:', clientId);
    }

    res.clearCookie('vybeztribe_client_session');
    
    return res.json({
      success: true,
      message: 'Session terminated'
    });

  } catch (error) {
    console.error('Client logout error:', error);
    res.clearCookie('vybeztribe_client_session');
    return res.json({
      success: true,
      message: 'Session cleared'
    });
  }
});

const getUserData = async (userId, pool) => {
  try {
    const result = await pool.query(
      'SELECT user_id as id, email, first_name, last_name FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

module.exports = router;