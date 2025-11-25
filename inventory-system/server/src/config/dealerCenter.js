/**
 * DealerCenter Configuration
 *
 * This file contains configuration for DealerCenter DMS integration,
 * including dealer information and FTP settings.
 */

module.exports = {
  // Dealer Information
  dealer: {
    id: '29007654',
    name: 'JP Automotive Group LLC',
    address: '2529 Connie Dr #15',
    city: 'Sacramento',
    state: 'CA',
    zip: '95815',
    phone: '916-618-7197'
  },

  // FTP Configuration
  ftp: {
    host: process.env.DEALER_CENTER_FTP_HOST || 'ftp.nowcom.com',
    user: process.env.DEALER_CENTER_FTP_USER || 'JPAutomotiveGroup',
    password: process.env.DEALER_CENTER_FTP_PASSWORD,
    port: parseInt(process.env.DEALER_CENTER_FTP_PORT || '21'),
    secure: false, // Use explicit FTP (not FTPS)
    secureOptions: {
      rejectUnauthorized: false
    }
  },

  // Export Configuration
  export: {
    filename: 'jp-auto-inventory.csv',
    remotePath: '/', // Root directory on FTP server
    schedule: '0 2 * * *', // Daily at 2:00 AM (cron format)
    includeHeaders: true
  },

  // CSV Field Mapping (based on DealerCenter template)
  csvFields: [
    'DealerID',
    'DealerName',
    'Address',
    'City',
    'State',
    'Zip',
    'Phone',
    'StockNumber',
    'VIN',
    'Year',
    'Make',
    'Model',
    'Trim',
    'Odometer',
    'Price',
    'Exterior Color',
    'InteriorColor',
    'Transmission',
    'PhotoURLs',
    'WebAdDescription',
    'VDP',
    'FuelType',
    'Description',
    'LatestPhotoModifiedDate'
  ]
};
