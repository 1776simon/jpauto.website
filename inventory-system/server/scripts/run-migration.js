const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, '../src/migrations/add-latest-photo-modified.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add-latest-photo-modified.sql');
    console.log('SQL:', sql);

    await sequelize.query(sql);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
