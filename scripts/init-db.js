const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

async function initDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read and execute schema
    const schema = fs.readFileSync(
      path.join(__dirname, '../src/app/api/db/schema.sql'),
      'utf8'
    );
    await pool.query(schema);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDb(); 