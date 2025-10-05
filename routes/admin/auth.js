// backend/routes/admin/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../../config/db');
const router = express.Router();

// Login Route
router.post('/login', async (req, res) => {
  let pool;
  try {
    pool = getPool();
    
    const { identifier, email, password } = req.body;
    
    const loginField = identifier || email;

    if (!loginField || !password) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Username/email and password are required',
        message: null
      });
    }

    const trimmedIdentifier = loginField.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Username/email and password cannot be empty',
        message: null
      });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Password must be at least 6 characters',
        message: null
      });
    }

    console.log('Admin login attempt for:', trimmedIdentifier);

    let adminResult;
    try {
      adminResult = await pool.query(
        `SELECT admin_id, first_name, last_name, email, phone, role, permissions, 
                password_hash, last_login, status, username
         FROM admins 
         WHERE (email = $1 OR phone = $1 OR username = $1) AND status = 'active'
         LIMIT 1`,
        [trimmedIdentifier]
      );
    } catch (error) {
      if (error.message && error.message.includes('username')) {
        console.log('Username column not found, trying without it...');
        adminResult = await pool.query(
          `SELECT admin_id, first_name, last_name, email, phone, role, permissions,
                  password_hash, last_login, status
           FROM admins 
           WHERE (email = $1 OR phone = $1) AND status = 'active'
           LIMIT 1`,
          [trimmedIdentifier]
        );
      } else {
        throw error;
      }
    }

    console.log('Admin query result:', adminResult.rows.length > 0 ? 'Found admin' : 'No admin found');

    if (adminResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid credentials',
        message: null
      });
    }

    const admin = adminResult.rows[0];
    console.log('Found admin with role:', admin.role);

    const isValidPassword = await bcrypt.compare(trimmedPassword, admin.password_hash);
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        error: 'Invalid credentials',
        message: null
      });
    }

    // Regenerate session ID on login for security
    req.session.regenerate(async (err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ 
          success: false, 
          authenticated: false,
          user: null,
          error: 'Could not create session',
          message: 'Session creation failed'
        });
      }

      try {
        // Store admin ID in session - express-session handles the rest
        req.session.adminId = admin.admin_id;
        req.session.loginTime = new Date().toISOString();
        
        // Update last login in database
        await pool.query(
          'UPDATE admins SET last_login = NOW() WHERE admin_id = $1',
          [admin.admin_id]
        );
        
        console.log('Admin login successful:', {
          adminId: admin.admin_id,
          email: admin.email,
          role: admin.role
        });
        
        const userResponse = {
          admin_id: admin.admin_id,
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          permissions: admin.permissions || [],
          last_login: new Date().toISOString(),
          status: admin.status
        };

        return res.status(200).json({
          success: true,
          authenticated: true,
          user: userResponse,
          csrf_token: null,
          error: null,
          message: 'Login successful'
        });
      } catch (updateError) {
        console.error('Error updating last login:', updateError);
        return res.status(500).json({
          success: false,
          authenticated: false,
          user: null,
          error: 'Login processing failed',
          message: null
        });
      }
    });

  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return res.status(500).json({
      success: false,
      authenticated: false,
      user: null,
      error: 'Internal server error',
      message: 'Login failed due to server error'
    });
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  console.log('Admin logout attempt for session:', req.session.id);
  
  req.session.destroy(err => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ 
        success: false, 
        authenticated: false,
        user: null,
        error: 'Could not log out, please try again',
        message: null
      });
    }
    
    console.log('Admin logout successful - session destroyed');
    
    res.status(200).json({ 
      success: true, 
      authenticated: false,
      user: null,
      error: null,
      message: 'Logout successful' 
    });
  });
});

// Verify Route
router.get('/verify', async (req, res) => {
  try {
    const pool = getPool();
    
    const adminId = req.session?.adminId;

    console.log('Admin session verification:', {
      hasSession: !!req.session,
      hasAdminId: !!adminId,
      sessionId: req.session?.id
    });

    if (!adminId) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        csrf_token: null,
        error: 'No active session found',
        message: null
      });
    }

    const adminResult = await pool.query(
      `SELECT admin_id, first_name, last_name, email, phone, role, permissions, 
              last_login, status
       FROM admins 
       WHERE admin_id = $1 AND status = 'active'
       LIMIT 1`,
      [adminId]
    );

    console.log('Admin verification query result:', adminResult.rows.length > 0 ? 'Valid admin found' : 'Admin not found/inactive');

    if (adminResult.rows.length === 0) {
      req.session.destroy((err) => {
        if (err) console.error('Error destroying invalid session:', err);
      });
      
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null,
        csrf_token: null,
        error: 'Invalid or expired session',
        message: null
      });
    }

    const admin = adminResult.rows[0];

    console.log('Admin session verified successfully for:', admin.admin_id, 'with role:', admin.role);

    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        admin_id: admin.admin_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions || [],
        last_login: admin.last_login,
        status: admin.status
      },
      csrf_token: null,
      error: null,
      message: 'Session verified'
    });

  } catch (error) {
    console.error('Admin session verification error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      user: null,
      csrf_token: null,
      error: 'Session verification failed',
      message: 'Internal server error'
    });
  }
});

module.exports = router;