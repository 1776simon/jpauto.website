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
    // schedule: '0 22 * * *', // Not scheduled yet - manual export only
    includeHeaders: false // CarsForSale.com format does not include headers
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
