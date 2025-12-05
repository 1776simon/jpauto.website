#!/usr/bin/env node
/**
 * Migrate Photo URLs from R2.dev to Custom Domain
 *
 * Updates all existing vehicle photo URLs from:
 *   https://pub-1e321c8447c84ba3a8b4d85d8487d779.r2.dev/...
 * to:
 *   https://cdn.jpautomotivegroup.com/...
 *
 * Usage: node scripts/migrate-photo-urls.js
 */

const { sequelize } = require('../src/config/database');
const Inventory = require('../src/models/Inventory');
const PendingSubmission = require('../src/models/PendingSubmission');
const logger = require('../src/config/logger');
require('dotenv').config();

// Old and new URLs
const OLD_URL = 'https://pub-1e321c8447c84ba3a8b4d85d8487d779.r2.dev';
const NEW_URL = process.env.R2_PUBLIC_URL || 'https://cdn.jpautomotivegroup.com';

/**
 * Update photo URLs in a record
 */
function migratePhotoUrls(record) {
  let updated = false;

  // Update images array
  if (record.images && Array.isArray(record.images)) {
    const updatedImages = record.images.map(url => {
      if (url && url.startsWith(OLD_URL)) {
        updated = true;
        return url.replace(OLD_URL, NEW_URL);
      }
      return url;
    });
    record.images = updatedImages;
  }

  // Update primary image URL
  if (record.primaryImageUrl && record.primaryImageUrl.startsWith(OLD_URL)) {
    updated = true;
    record.primaryImageUrl = record.primaryImageUrl.replace(OLD_URL, NEW_URL);
  }

  return updated;
}

/**
 * Main migration function
 */
async function migrateUrls() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Photo URL Migration: R2.dev → Custom Domain         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`Old URL: ${OLD_URL}`);
  console.log(`New URL: ${NEW_URL}\n`);

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    let inventoryUpdated = 0;
    let submissionsUpdated = 0;

    // Migrate Inventory
    console.log('🔄 Migrating Inventory table...');
    const inventoryRecords = await Inventory.findAll();

    for (const record of inventoryRecords) {
      if (migratePhotoUrls(record)) {
        await record.save();
        inventoryUpdated++;
        console.log(`  ✓ Updated: ${record.year} ${record.make} ${record.model} (${record.vin})`);
      }
    }

    console.log(`\n✅ Inventory: ${inventoryUpdated} vehicles updated out of ${inventoryRecords.length} total\n`);

    // Migrate Pending Submissions
    console.log('🔄 Migrating Pending Submissions table...');
    const submissionRecords = await PendingSubmission.findAll();

    for (const record of submissionRecords) {
      if (migratePhotoUrls(record)) {
        await record.save();
        submissionsUpdated++;
        console.log(`  ✓ Updated: ${record.year} ${record.make} ${record.model} (${record.customerName})`);
      }
    }

    console.log(`\n✅ Pending Submissions: ${submissionsUpdated} submissions updated out of ${submissionRecords.length} total\n`);

    // Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                  Migration Complete!                   ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`Total Updated: ${inventoryUpdated + submissionsUpdated} records`);
    console.log(`  • Inventory: ${inventoryUpdated}`);
    console.log(`  • Submissions: ${submissionsUpdated}\n`);

    console.log('✅ All photo URLs now use: ' + NEW_URL + '\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run migration
migrateUrls();
