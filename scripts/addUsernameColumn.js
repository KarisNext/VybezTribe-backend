// C:\Projects\VybezTribe\backend\scripts\addUsernameColumn.js
async function addUsernameColumn() {
  try {
    const { getPool } = require('../config/db');
    const pool = getPool();

    console.log('Adding username column to admins table...');

    // Add username column
    await pool.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
    `);

    console.log('Username column added successfully!');

    // Check if there are existing admins without usernames
    const existingAdmins = await pool.query(
      'SELECT admin_id, first_name, last_name, email FROM admins WHERE username IS NULL'
    );

    if (existingAdmins.rows.length > 0) {
      console.log(`Found ${existingAdmins.rows.length} admin(s) without usernames. Generating usernames...`);

      for (const admin of existingAdmins.rows) {
        // Generate username from first name and last name
        const baseUsername = (admin.first_name.toLowerCase() + admin.last_name.toLowerCase().charAt(0)).replace(/[^a-z0-9]/g, '');
        let username = baseUsername;
        let counter = 1;

        // Check if username exists, if so, add number suffix
        while (true) {
          const existingUsername = await pool.query(
            'SELECT admin_id FROM admins WHERE username = $1',
            [username]
          );

          if (existingUsername.rows.length === 0) {
            break;
          }

          username = `${baseUsername}${counter}`;
          counter++;
        }

        // Update admin with generated username
        await pool.query(
          'UPDATE admins SET username = $1 WHERE admin_id = $2',
          [username, admin.admin_id]
        );

        console.log(`Generated username '${username}' for ${admin.first_name} ${admin.last_name}`);
      }
    }

    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admins_username 
      ON admins(username);
    `);

    console.log('Username column setup completed successfully!');

  } catch (error) {
    console.error('Error adding username column:', error.message);

    if (error.code === '42701') {
      console.log('Username column already exists.');
    }
  } finally {
    process.exit();
  }
}

addUsernameColumn();