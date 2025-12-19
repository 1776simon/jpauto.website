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
    getFilename: () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `29007654_${year}${month}${day}.csv`;
    },
    remotePath: '/', // Root directory on FTP server
    schedule: '0 22 * * *', // Daily at 10:00 PM PST (cron format)
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
