const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');
require('dotenv').config();

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('🔄 Reading schema file...');
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Executing SQL schema...');
    await sequelize.query(schema);

    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    console.log('  - users');
    console.log('  - pending_submissions');
    console.log('  - inventory');
    console.log('  - export_logs');
    console.log('  - activity_logs');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
