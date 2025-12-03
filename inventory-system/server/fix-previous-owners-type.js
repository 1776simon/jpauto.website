/**
 * Fix previous_owners column type from INTEGER to VARCHAR(10)
 * To support values like "4+"
 */

const { Client } = require('pg');

async function fixPreviousOwnersType() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Change column type from INTEGER to VARCHAR(10) for both tables
    const query = `
      -- Fix inventory table
      ALTER TABLE inventory
      ALTER COLUMN previous_owners TYPE VARCHAR(10);

      -- Fix pending_submissions table (if exists)
      ALTER TABLE pending_submissions
      ALTER COLUMN previous_owners TYPE VARCHAR(10);
    `;

    await client.query(query);
    console.log('✅ Updated previous_owners column type to VARCHAR(10)');
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixPreviousOwnersType();
