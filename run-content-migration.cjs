const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'teachwave',
      multipleStatements: true
    });

    console.log('✓ Connected to database');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'content_management_tables.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');

    console.log('✓ SQL file loaded');
    console.log('→ Executing migration...');

    // Execute SQL
    await connection.query(sql);

    console.log('✓ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - learning_materials');
    console.log('  - tests');
    console.log('  - test_questions');
    console.log('  - test_submissions');
    console.log('  - test_answers');
    console.log('  - quizzes');
    console.log('  - quiz_questions');
    console.log('  - quiz_submissions');
    console.log('  - quiz_answers');
    console.log('  - additional_resources');

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
