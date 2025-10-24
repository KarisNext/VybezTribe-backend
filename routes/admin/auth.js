// backend/routes/admin/auth.js - COMPLETE FIXED VERSION
const express = require('express');
const bcrypt = require('bcrypt');
const { getPool } = require('../../config/db');

const router = express.Router();

// ============================================
// ADMIN LOGIN
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log('Admin login attempt:', {
      identifier,
      hasPassword: !!password,
      sessionId: req.session?.id
    });

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Email/username and password are required',
        message: 'Missing credentials'
      });
    }

    const pool = getPool();

    // Find admin by email or username
    const adminQuery = `
      SELECT 
        admin_id, first_name, last_name, email, phone, 
        username, role, password_hash, permissions, status
      FROM admins 
      WHERE (email = $1 OR username = $1) AND status = 'active'
      LIMIT 1
    `;

    const adminResult = await pool.query(adminQuery, [identifier.trim()]);

    if (adminResult.rows.length === 0) {
      console.log('Admin not found or inactive:', identifier);
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid credentials',
        message: 'Email/username or password is incorrect'
      });
    }

    const admin = adminResult.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password.trim(), admin.password_hash);

    if (!passwordMatch) {
      console.log('Invalid password for admin:', identifier);
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid credentials',
        message: 'Email/username or password is incorrect'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE admin_id = $1',
      [admin.admin_id]
    );

    // Create admin session
    req.session.adminId = admin.admin_id;
    req.session.role = admin.role;
    req.session.email = admin.email;
    req.session.isAdmin = true;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          success: false,
          authenticated: false,
          user: null,
          error: 'Failed to create session',
          message: 'Session creation failed'
        });
      }

      // Remove sensitive data
      delete admin.password_hash;

      console.log('Admin login successful:', {
        adminId: admin.admin_id,
        email: admin.email,
        role: admin.role,
        sessionId: req.session.id
      });

      return res.json({
        success: true,
        authenticated: true,
        user: admin,
        error: null,
        message: 'Login successful',
        csrfToken: req.session.id
      });
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Login failed',
      message: 'Internal server error'
    });
  }
});

// ============================================
// ADMIN VERIFY SESSION
// ============================================
router.get('/verify', async (req, res) => {
  try {
    console.log('Admin session verify:', {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      hasAdminId: !!req.session?.adminId,
      adminId: req.session?.adminId
    });

    // Check if admin session exists
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        error: null,
        message: 'No admin session found'
      });
    }

    const pool = getPool();

    // Verify admin still exists and is active
    const adminQuery = `
      SELECT 
        admin_id, first_name, last_name, email, phone, 
        role, permissions, last_login, status
      FROM admins 
      WHERE admin_id = $1 AND status = 'active'
      LIMIT 1
    `;

    const adminResult = await pool.query(adminQuery, [req.session.adminId]);

    if (adminResult.rows.length === 0) {
      console.log('Admin no longer active, destroying session');
      
      req.session.destroy((err) => {
        if (err) console.error('Session destroy error:', err);
      });

      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Session expired',
        message: 'Admin account no longer active'
      });
    }

    const admin = adminResult.rows[0];

    console.log('Admin session verified:', {
      adminId: admin.admin_id,
      email: admin.email,
      role: admin.role
    });

    return res.json({
      success: true,
      authenticated: true,
      user: admin,
      error: null,
      message: 'Session valid',
      csrfToken: req.session.id
    });

  } catch (error) {
    console.error('Admin verify error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Verification failed',
      message: 'Internal server error'
    });
  }
});

// ============================================
// ADMIN LOGOUT
// ============================================
router.post('/logout', async (req, res) => {
  try {
    console.log('Admin logout:', {
      sessionId: req.session?.id,
      adminId: req.session?.adminId
    });

    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.json({
            success: true,
            message: 'Logged out with errors'
          });
        }

        res.clearCookie('vybeztribe_admin_session');
        
        return res.json({
          success: true,
          message: 'Logged out successfully'
        });
      });
    } else {
      return res.json({
        success: true,
        message: 'No session to logout'
      });
    }

  } catch (error) {
    console.error('Admin logout error:', error);
    return res.json({
      success: true,
      message: 'Logged out'
    });
  }
});

// ============================================
// ADMIN REFRESH SESSION
// ============================================
router.post('/refresh', async (req, res) => {
  try {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({
        success: false,
        message: 'No session to refresh'
      });
    }

    req.session.touch();
    
    req.session.save((err) => {
      if (err) {
        console.error('Session refresh error:', err);
        return res.status(500).json({
          success: false,
          message: 'Refresh failed'
        });
      }

      return res.json({
        success: true,
        message: 'Session refreshed',
        csrfToken: req.session.id
      });
    });

  } catch (error) {
    console.error('Admin refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Refresh failed'
    });
  }
});

module.exports = router;
