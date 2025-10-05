// C:\Projects\VybezTribe\backend\scripts\createSeraAdmin.js
const bcrypt = require('bcryptjs');

async function createSeraAdmin() {
  try {
    const { getPool } = require('../config/db');
    const pool = getPool();

    // Sera admin user details
    const adminData = {
      first_name: 'Rahab',
      last_name: 'Waithera',
      username: 'sera',
      email: 'sera@vybeztribe.com',
      phone: '+254795785304',
      password: 'sera2024VT',
      role: 'admin'
    };

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT admin_id FROM admins WHERE username = $1 OR email = $2 OR phone = $3',
      [adminData.username, adminData.email, adminData.phone]
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists with username:', adminData.username);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Insert the new admin user
    const result = await pool.query(
      `INSERT INTO admins 
       (first_name, last_name, username, email, phone, password_hash, role, permissions, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
       RETURNING admin_id, first_name, last_name, username, email, role`,
      [
        adminData.first_name,
        adminData.last_name,
        adminData.username,
        adminData.email,
        adminData.phone,
        hashedPassword,
        adminData.role,
        JSON.stringify(['manage_news', 'manage_categories', 'manage_comments', 'view_analytics']), // Standard admin permissions
        'active'
      ]
    );

    const newAdmin = result.rows[0];

    console.log('Admin user created successfully!');
    console.log('User Details:');
    console.log(`   ID: ${newAdmin.admin_id}`);
    console.log(`   Name: ${newAdmin.first_name} ${newAdmin.last_name}`);
    console.log(`   Username: ${newAdmin.username}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Role: ${adminData.role}`);
    console.log('Login Credentials:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Password: ${adminData.password}`);

  } catch (error) {
    console.error('Error creating admin user:', error.message);
    
    if (error.code === '23505') { // Unique violation
      console.log('Hint: User with this username, email, or phone already exists');
    }
  } finally {
    process.exit();
  }
}

// Run the script
createSeraAdmin();