/**
 * CarsForSale.com Configuration
 *
 * This file contains configuration for CarsForSale.com lead provider integration.
 */

module.exports = {
  // Dealer Information
  dealer: {
    id: '1049978' // CarsForSale.com Dealer ID
  },

  // Export Configuration
  export: {
    filename: 'inventory.txt', // CarsForSale.com requires .txt extension
    schedule: '0 3 * * *', // 3:00 AM daily (after Jekyll and DealerCenter)
    includeHeaders: false, // CarsForSale.com format does not include headers
    remotePath: process.env.CARSFORSALE_FTP_REMOTE_PATH || '/' // FTP remote directory
  },

  // FTP Configuration (credentials from environment variables)
  ftp: {
    host: process.env.CARSFORSALE_FTP_HOST,
    port: parseInt(process.env.CARSFORSALE_FTP_PORT || '21'),
    user: process.env.CARSFORSALE_FTP_USER,
    password: process.env.CARSFORSALE_FTP_PASSWORD,
    secure: false, // Use false for regular FTP, true for FTPS
    secureOptions: { rejectUnauthorized: false }
  },

  // CSV Field Mapping (based on CarsForSale.com Standard Data Feed format)
  // Order matters - must match spec exactly
  csvFields: [
    'CarsForSaleDealerID',
    'NewUsed',
    'VIN',
    'StockNumber',
    'Make',
    'Model',
    'ModelYear',
    'Trim/Package',
    'BodyStyle',
    'Miles',
    'Engine',
    'Cylinders',
    'FuelType',
    'Transmission',
    'Price',
    'ExteriorColor',
    'InteriorColor',
    'Options',
    'Description',
    'PhotoURLs'
  ]
};
