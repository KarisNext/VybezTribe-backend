// backend/routes/admin/users.js 
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getPool } = require('../../config/db');

// Middleware to check if admin is authenticated
const requireAdminAuth = async (req, res, next) => {
  try {
    console.log('Admin auth check:', {
      hasSession: !!req.session,
      hasAdminId: !!req.session?.adminId,
      sessionId: req.session?.id
    });

    if (!req.session?.adminId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin authentication required',
        authenticated: false
      });
    }

    // Verify admin exists and is active
    const pool = getPool();
    const adminCheck = await pool.query(
      'SELECT admin_id, role, status FROM admins WHERE admin_id = $1 AND status = $2',
      [req.session.adminId, 'active']
    );

    if (adminCheck.rows.length === 0) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin session',
        authenticated: false
      });
    }

    req.adminUser = adminCheck.rows[0];
    console.log('Admin authenticated:', req.adminUser.admin_id, 'with role:', req.adminUser.role);
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication check failed' 
    });
  }
};

// GET /api/admin/users - Fetch all admin users
router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { search, role } = req.query;
    
    console.log('Fetching admin users with filters:', { search, role });
    
    let query = `
      SELECT 
        a.admin_id, 
        a.first_name, 
        a.last_name, 
        a.email, 
        a.phone,
        a.role,
        a.status,
        a.created_at,
        a.last_login,
        COALESCE(COUNT(n.news_id), 0) AS posts_count
      FROM 
        admins a
      LEFT JOIN 
        news n ON a.admin_id = n.author_id
    `;
    
    const conditions = ['a.status = $1']; // Always filter for active admins
    const params = ['active'];
    let paramIndex = 2;

    // Add search filter
    if (search && search.trim()) {
      conditions.push(`(
        a.first_name ILIKE $${paramIndex} OR 
        a.last_name ILIKE $${paramIndex} OR 
        a.email ILIKE $${paramIndex}
      )`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Add role filter
    if (role && role.trim()) {
      conditions.push(`a.role = $${paramIndex}`);
      params.push(role.trim());
      paramIndex++;
    }

    // Add WHERE clause
    query += ' WHERE ' + conditions.join(' AND ');

    query += `
      GROUP BY 
        a.admin_id, a.first_name, a.last_name, a.email, a.phone, a.role, a.status, a.created_at, a.last_login
      ORDER BY 
        a.created_at DESC
    `;

    console.log('Executing query with params:', params);
    const result = await pool.query(query, params);
    console.log('Found', result.rows.length, 'admin users');

    res.status(200).json({ 
      success: true, 
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      users: [],
      error: error.message
    });
  }
});

// POST /api/admin/users - Create new admin user
router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { first_name, last_name, email, phone, password, role } = req.body;

    console.log('Creating new admin user:', { first_name, last_name, email, role });

    // Validation
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, email, password, and role are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Validate password length
    if (password.trim().length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Validate role
    const validRoles = ['editor', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role specified' 
      });
    }

    // Check role permissions - only super_admin can create super_admin
    if (role.trim() === 'super_admin' && req.adminUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super administrators can create super admin accounts' 
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT admin_id FROM admins WHERE email = $1', 
      [email.trim().toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    // Insert new user
    const result = await pool.query(
      `INSERT INTO admins (first_name, last_name, email, phone, password_hash, role, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW()) 
       RETURNING admin_id, first_name, last_name, email, phone, role, status, created_at`,
      [
        first_name.trim(), 
        last_name.trim(), 
        email.trim().toLowerCase(), 
        phone?.trim() || null, 
        hashedPassword, 
        role.trim()
      ]
    );

    console.log('Created new admin user:', result.rows[0].admin_id);

    // Log the activity if admin_activity_log table exists
    try {
      await pool.query(
        `INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          req.session.adminId, 
          'create_user', 
          'admin', 
          result.rows[0].admin_id, 
          `Created new admin user: ${email.trim().toLowerCase()}`, 
          req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection.remoteAddress
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity (table may not exist):', logError.message);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// PUT /api/admin/users?id=:id - Update admin user
router.put('/', requireAdminAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.query;
    const { first_name, last_name, email, phone, role } = req.body;

    console.log('Updating admin user:', id, { first_name, last_name, email, role });

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Validation
    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !role?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, email, and role are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    // Validate role
    const validRoles = ['editor', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role specified' 
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT admin_id, email, role FROM admins WHERE admin_id = $1', 
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Prevent self-demotion from super_admin
    if (parseInt(id) === req.session.adminId && 
        existingUser.rows[0].role === 'super_admin' && 
        role.trim() !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot change your own super admin role' 
      });
    }

    // Check role permissions
    if (role.trim() === 'super_admin' && req.adminUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super administrators can assign super admin role' 
      });
    }

    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT admin_id FROM admins WHERE email = $1 AND admin_id != $2', 
      [email.trim().toLowerCase(), id]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already in use by another user' 
      });
    }

    // Update user
    const result = await pool.query(
      `UPDATE admins 
       SET first_name = $1, last_name = $2, email = $3, phone = $4, role = $5, updated_at = NOW() 
       WHERE admin_id = $6 
       RETURNING admin_id, first_name, last_name, email, phone, role, status, updated_at`,
      [
        first_name.trim(), 
        last_name.trim(), 
        email.trim().toLowerCase(), 
        phone?.trim() || null, 
        role.trim(), 
        id
      ]
    );

    console.log('Updated admin user:', id);

    // Log the activity
    try {
      await pool.query(
        `INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          req.session.adminId, 
          'update_user', 
          'admin', 
          id, 
          `Updated admin user: ${email.trim().toLowerCase()}`, 
          req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection.remoteAddress
        ]
      );
    } catch (logError) {
      console.warn('Failed to log activity:', logError.message);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Admin user updated successfully',
      user: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// DELETE /api/admin/users?id=:id - Delete admin user
router.delete('/', requireAdminAuth, async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.query;

    console.log('Deleting admin user:', id);

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT admin_id, email, first_name, last_name, role FROM admins WHERE admin_id = $1', 
      [id]
    );
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const userToDelete = existingUser.rows[0];

    // Prevent self-deletion
    if (parseInt(id) === req.session.adminId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }

    // Prevent deletion of the last super_admin
    if (userToDelete.role === 'super_admin') {
      const superAdminCount = await pool.query(
        'SELECT COUNT(*) as count FROM admins WHERE role = $1 AND status = $2',
        ['super_admin', 'active']
      );
      
      if (parseInt(superAdminCount.rows[0].count) <= 1) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot delete the last super administrator' 
        });
      }
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Update news posts to remove author reference instead of deleting them
      await pool.query(
        'UPDATE news SET author_id = NULL WHERE author_id = $1',
        [id]
      );

      // Delete user
      await pool.query('DELETE FROM admins WHERE admin_id = $1', [id]);

      // Log the activity
      try {
        await pool.query(
          `INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            req.session.adminId, 
            'delete_user', 
            'admin', 
            id, 
            `Deleted admin user: ${userToDelete.first_name} ${userToDelete.last_name} (${userToDelete.email})`, 
            req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || req.connection.remoteAddress
          ]
        );
      } catch (logError) {
        console.warn('Failed to log activity:', logError.message);
      }

      // Commit transaction
      await pool.query('COMMIT');

      console.log('Deleted admin user:', id);

      res.status(200).json({ 
        success: true, 
        message: 'Admin user deleted successfully' 
      });

    } catch (deleteError) {
      await pool.query('ROLLBACK');
      throw deleteError;
    }
    
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

module.exports = router;