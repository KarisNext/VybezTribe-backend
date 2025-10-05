// backend/middleware/adminAuth.js
const { getPool } = require('../config/db');

const requireAdminAuth = async (req, res, next) => {
  try {
    // Check if admin is logged in via session
    const adminId = req.session?.adminId;

    console.log('Admin auth check:', {
      hasSession: !!req.session,
      hasAdminId: !!adminId,
      sessionId: req.session?.id
    });

    if (!adminId) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Admin session required',
        message: 'Please log in to access this resource'
      });
    }

    // Verify admin still exists and is active
    const pool = getPool();
    const adminResult = await pool.query(
      `SELECT admin_id, first_name, last_name, email, phone, role, permissions, status
       FROM admins 
       WHERE admin_id = $1 AND status = 'active'
       LIMIT 1`,
      [adminId]
    );

    console.log('Admin auth query result:', adminResult.rows.length > 0 ? 'Valid admin' : 'Invalid/inactive admin');

    if (adminResult.rows.length === 0) {
      // Admin is no longer valid, destroy the session
      req.session.destroy((err) => {
        if (err) console.error('Error destroying invalid session:', err);
      });
      
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Invalid or expired admin session',
        message: 'Please log in again'
      });
    }
    
    // Add admin info to request object for use in protected routes
    req.admin = adminResult.rows[0];
    req.adminId = adminResult.rows[0].admin_id;
    
    console.log('Admin auth successful for:', req.admin.email, 'with role:', req.admin.role);
    
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Admin authentication failed',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  requireAdminAuth
};