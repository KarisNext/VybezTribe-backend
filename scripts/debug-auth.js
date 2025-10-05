// Save as: C:\Projects\VybezTribe\backend\debug-auth.js
const bcrypt = require('bcryptjs');

async function debugAuth() {
  console.log('🔍 VybezTribe Authentication Debug');
  console.log('==================================');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const { getPool } = require('./config/db');
    const pool = getPool();
    const client = await pool.connect();
    console.log('   ✅ Database connection successful');
    
    // Check if admins table exists and has data
    console.log('2. Checking admins table...');
    const adminCheck = await client.query(`
      SELECT admin_id, email, role, 
             CASE WHEN password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status,
             CASE WHEN username IS NOT NULL THEN username ELSE 'No username' END as username_status
      FROM admins 
      ORDER BY admin_id;
    `);
    
    if (adminCheck.rows.length === 0) {
      console.log('   ❌ No admin users found in database');
      console.log('   💡 You need to create admin users first');
    } else {
      console.log('   📋 Admin users found:');
      adminCheck.rows.forEach(admin => {
        console.log(`      - ID: ${admin.admin_id}, Email: ${admin.email}, Role: ${admin.role}`);
        console.log(`        Password: ${admin.password_status}, Username: ${admin.username_status}`);
      });
    }

    // Test password hashing
    console.log('3. Testing password hash...');
    const testPassword = 'password';
    const testEmail = 'admin@vybeztribe.co.ke';
    
    const existingAdmin = await client.query(
      'SELECT password_hash FROM admins WHERE email = $1',
      [testEmail]
    );
    
    if (existingAdmin.rows.length > 0) {
      const isValid = await bcrypt.compare(testPassword, existingAdmin.rows[0].password_hash);
      console.log(`   Password "${testPassword}" for ${testEmail}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!isValid) {
        console.log('   💡 Try creating a new password hash...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`   🔑 New hash for "${testPassword}": ${newHash}`);
        console.log('   📝 Run this SQL to update:');
        console.log(`   UPDATE admins SET password_hash = '${newHash}' WHERE email = '${testEmail}';`);
      }
    } else {
      console.log(`   ❌ Admin with email ${testEmail} not found`);
    }

    // Check admin_sessions table
    console.log('4. Checking admin_sessions table...');
    const sessionsCheck = await client.query(`
      SELECT COUNT(*) as session_count,
             COUNT(*) FILTER (WHERE is_active = true) as active_sessions,
             COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_sessions
      FROM admin_sessions;
    `);
    
    const sessionStats = sessionsCheck.rows[0];
    console.log(`   📊 Sessions - Total: ${sessionStats.session_count}, Active: ${sessionStats.active_sessions}, Valid: ${sessionStats.valid_sessions}`);

    client.release();
    pool.end();
    
    console.log('');
    console.log('🎯 Next steps:');
    console.log('   1. Make sure your backend server is running on port 5000');
    console.log('   2. If no admin users exist, create them');
    console.log('   3. If password is invalid, update the hash');
    console.log('   4. Run the database migration to add username column');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Database connection refused. Is PostgreSQL running?');
      console.log('   Start with: pg_ctl -D "C:\\PostgresData" start');
    }
    
    if (error.message.includes('relation "admins" does not exist')) {
      console.log('💡 Admins table does not exist. Run your database schema first.');
    }
  }
}

// Run the debug
debugAuth();

