const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');
require('dotenv').config();

async function runMigrations() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Get all migration files
    const migrationsDir = path.join(__dirname, '../src/migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found. Skipping migrations.');
      process.exit(0);
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found. Skipping migrations.');
      process.exit(0);
    }

    console.log(`📁 Found ${migrationFiles.length} migration file(s)`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`\n🔄 Running migration: ${file}`);

      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);

      if (typeof migration.up !== 'function') {
        console.log(`⚠️  Skipping ${file} - no 'up' function found`);
        continue;
      }

      try {
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        // Check if error is about table already existing
        if (error.message && error.message.includes('already exists')) {
          console.log(`⚠️  Migration ${file} skipped - objects already exist`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
