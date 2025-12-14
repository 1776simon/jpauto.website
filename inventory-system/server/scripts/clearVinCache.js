/**
 * Clear VIN Evaluation Cache
 * Run once to clear old cache entries (with 10 listings) so new 50-listing cache can be generated
 */

require('dotenv').config();
const { sequelize } = require('../src/models');

async function clearVinCache() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully');

    console.log('Clearing VIN evaluation cache...');
    const [result] = await sequelize.query('TRUNCATE TABLE vin_evaluation_cache');

    console.log('✅ VIN evaluation cache cleared successfully');
    console.log('New evaluations will now store up to 50 sample listings');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    process.exit(1);
  }
}

clearVinCache();
