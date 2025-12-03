/**
 * Quick fix script to increase body_type column length
 */

const { Client } = require('pg');

async function fixBodyTypeLength() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Increase body_type column length from VARCHAR(50) to VARCHAR(100)
    const query = `
      ALTER TABLE inventory
      ALTER COLUMN body_type TYPE VARCHAR(100);

      ALTER TABLE pending_submissions
      ALTER COLUMN body_type TYPE VARCHAR(100);
    `;

    await client.query(query);
    console.log('✅ Updated body_type column length to VARCHAR(100)');
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixBodyTypeLength();
