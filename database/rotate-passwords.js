// Script to generate new password hashes and update database
// Run: node database/rotate-passwords.js

import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import readline from 'readline';

config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function rotatePasswords() {
  console.log('\n⚠️  PASSWORD ROTATION UTILITY\n');
  console.log('This will update the default admin and teacher passwords.\n');

  try {
    // Get new passwords
    const adminPassword = await question('Enter new ADMIN password (min 8 chars): ');
    if (adminPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    const teacherPassword = await question('Enter new TEACHER password (min 8 chars): ');
    if (teacherPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters!');
      process.exit(1);
    }

    const confirm = await question('\n⚠️  This will change passwords in the database. Continue? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Cancelled.');
      process.exit(0);
    }

    // Hash passwords
    console.log('\n🔒 Hashing passwords...');
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const teacherHash = await bcrypt.hash(teacherPassword, 12);

    // Connect to database
    console.log('📡 Connecting to database...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'teachwave',
      port: process.env.DB_PORT || 3306,
    });

    // Update passwords
    console.log('💾 Updating passwords...');
    
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [adminHash, 'admin@teachwave.com']
    );

    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [teacherHash, 'teacher@teachwave.com']
    );

    await connection.end();

    console.log('\n✅ Passwords updated successfully!\n');
    console.log('New credentials:');
    console.log('  Admin: admin@teachwave.com / [your new password]');
    console.log('  Teacher: teacher@teachwave.com / [your new password]');
    console.log('\n⚠️  IMPORTANT: Document these credentials securely!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

rotatePasswords();
