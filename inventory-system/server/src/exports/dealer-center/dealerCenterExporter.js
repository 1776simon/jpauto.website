const fs = require('fs').promises;
const path = require('path');
const { parse } = require('json2csv');

/**
 * Export inventory to Dealer Center CSV format
 * @param {Array} vehicles - Array of vehicle objects from database
 * @param {string} outputPath - Output file path
 * @returns {Promise<object>} - Export results
 */
const exportToDealerCenter = async (vehicles, outputPath = null) => {
  try {
    const csv = generateDealerCenterCSV(vehicles);

    // Default output path
    if (!outputPath) {
      const exportDir = path.resolve(__dirname, '../../../exports/dealer-center');
      await fs.mkdir(exportDir, { recursive: true });
      outputPath = path.join(exportDir, `dealer_center_${Date.now()}.csv`);
    }

    await fs.writeFile(outputPath, csv, 'utf8');

    return {
      success: true,
      filePath: outputPath,
      vehicleCount: vehicles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Dealer Center export failed: ${error.message}`);
  }
};

/**
 * Generate Dealer Center CSV
 * @param {Array} vehicles - Array of vehicle objects
 * @returns {string} - CSV string
 */
const generateDealerCenterCSV = (vehicles) => {
  // Map vehicles to Dealer Center format
  const dealerCenterVehicles = vehicles.map(vehicle => ({
    // Identification
    'Stock Number': vehicle.stockNumber || '',
    'VIN': vehicle.vin,
    'Status': mapStatus(vehicle.status),

    // Vehicle Information
    'Year': vehicle.year,
    'Make': vehicle.make,
    'Model': vehicle.model,
    'Trim': vehicle.trim || '',
    'Body Style': vehicle.bodyType || '',

    // Pricing
    'Retail Price': Math.round(vehicle.price),
    'Cost': vehicle.cost ? Math.round(vehicle.cost) : '',
    'MSRP': vehicle.msrp ? Math.round(vehicle.msrp) : '',

    // Details
    'Mileage': vehicle.mileage,
    'Exterior Color': vehicle.exteriorColor || '',
    'Interior Color': vehicle.interiorColor || '',
    'Transmission': vehicle.transmission || '',
    'Engine': vehicle.engine || '',
    'Fuel Type': vehicle.fuelType || '',
    'Drivetrain': vehicle.drivetrain || '',
    'Doors': vehicle.doors || '',
    'Title Status': vehicle.titleStatus || 'Clean',

    // Performance
    'MPG City': vehicle.mpgCity || '',
    'MPG Highway': vehicle.mpgHighway || '',
    'Horsepower': vehicle.horsepower || '',

    // History
    'Previous Owners': vehicle.previousOwners || '',
    'Accident History': vehicle.accidentHistory || 'None',
    'Service Records': vehicle.serviceRecords || '',
    'Carfax Available': vehicle.carfaxAvailable ? 'Yes' : 'No',
    'Carfax URL': vehicle.carfaxUrl || '',

    // Warranty
    'Warranty': vehicle.warrantyDescription || '',

    // Description
    'Description': vehicle.description || '',
    'Marketing Title': vehicle.marketingTitle || '',

    // Features (semicolon-separated)
    'Features': vehicle.features && vehicle.features.length > 0 ? vehicle.features.join('; ') : '',

    // Images (semicolon-separated URLs)
    'Primary Image': vehicle.primaryImageUrl || '',
    'Additional Images': vehicle.images ? vehicle.images.slice(1).join('; ') : '',
    'Image Count': vehicle.images ? vehicle.images.length : 0,

    // Metadata
    'Featured': vehicle.featured ? 'Yes' : 'No',
    'Date Added': vehicle.dateAdded || vehicle.createdAt,
    'Sold Date': vehicle.soldDate || '',

    // Internal tracking
    'Source': vehicle.source || 'Manual Entry',
    'Created At': vehicle.createdAt,
    'Updated At': vehicle.updatedAt
  }));

  // Define all CSV fields
  const fields = [
    'Stock Number',
    'VIN',
    'Status',
    'Year',
    'Make',
    'Model',
    'Trim',
    'Body Style',
    'Retail Price',
    'Cost',
    'MSRP',
    'Mileage',
    'Exterior Color',
    'Interior Color',
    'Transmission',
    'Engine',
    'Fuel Type',
    'Drivetrain',
    'Doors',
    'Title Status',
    'MPG City',
    'MPG Highway',
    'Horsepower',
    'Previous Owners',
    'Accident History',
    'Service Records',
    'Carfax Available',
    'Carfax URL',
    'Warranty',
    'Description',
    'Marketing Title',
    'Features',
    'Primary Image',
    'Additional Images',
    'Image Count',
    'Featured',
    'Date Added',
    'Sold Date',
    'Source',
    'Created At',
    'Updated At'
  ];

  const csv = parse(dealerCenterVehicles, { fields });

  return csv;
};

/**
 * Map internal status to Dealer Center status
 */
const mapStatus = (status) => {
  const statusMap = {
    'available': 'In Stock',
    'sold': 'Sold',
    'pending': 'Pending Sale',
    'hold': 'On Hold'
  };

  return statusMap[status] || 'In Stock';
};

/**
 * Import from Dealer Center CSV (for syncing back from DMS)
 * @param {string} csvFilePath - Path to CSV file
 * @returns {Promise<Array>} - Array of vehicle objects
 */
const importFromDealerCenter = async (csvFilePath) => {
  try {
    const csvContent = await fs.readFile(csvFilePath, 'utf8');

    // Parse CSV (you'd use a CSV parser library here)
    // This is a placeholder implementation
    const vehicles = parseCSV(csvContent);

    return vehicles;
  } catch (error) {
    throw new Error(`Dealer Center import failed: ${error.message}`);
  }
};

/**
 * Parse CSV content (placeholder - implement with csv-parser or similar)
 */
const parseCSV = (csvContent) => {
  // Implement CSV parsing logic
  // For now, return empty array
  return [];
};

/**
 * Generate import template CSV
 * @param {string} outputPath - Output file path
 * @returns {Promise<string>} - Path to template file
 */
const generateImportTemplate = async (outputPath = null) => {
  try {
    // Sample vehicle data for template
    const sampleVehicle = {
      'Stock Number': 'SAMPLE001',
      'VIN': '1HGCV1F30LA000001',
      'Status': 'In Stock',
      'Year': 2020,
      'Make': 'Honda',
      'Model': 'Accord',
      'Trim': 'Sport',
      'Body Style': 'Sedan',
      'Retail Price': 22995,
      'Cost': '',
      'MSRP': 26995,
      'Mileage': 32000,
      'Exterior Color': 'Modern Steel Metallic',
      'Interior Color': 'Black Cloth',
      'Transmission': 'CVT Automatic',
      'Engine': '1.5L Turbo I4',
      'Fuel Type': 'Gasoline',
      'Drivetrain': 'FWD',
      'Doors': 4,
      'Title Status': 'Clean',
      'MPG City': 30,
      'MPG Highway': 38,
      'Horsepower': 192,
      'Previous Owners': 1,
      'Accident History': 'None',
      'Service Records': 'Complete',
      'Carfax Available': 'Yes',
      'Carfax URL': '',
      'Warranty': '3 Month / 3,000 Mile Powertrain',
      'Description': 'Beautiful 2020 Honda Accord Sport in excellent condition...',
      'Marketing Title': '2020 Honda Accord Sport - Low Miles!',
      'Features': 'Bluetooth; Backup Camera; Apple CarPlay; Lane Keeping Assist',
      'Primary Image': 'https://example.com/image1.jpg',
      'Additional Images': 'https://example.com/image2.jpg; https://example.com/image3.jpg',
      'Image Count': 3,
      'Featured': 'Yes',
      'Date Added': new Date().toISOString().split('T')[0],
      'Sold Date': '',
      'Source': 'Manual Entry',
      'Created At': new Date().toISOString(),
      'Updated At': new Date().toISOString()
    };

    const fields = Object.keys(sampleVehicle);
    const csv = parse([sampleVehicle], { fields });

    // Default output path
    if (!outputPath) {
      const exportDir = path.resolve(__dirname, '../../../exports/dealer-center');
      await fs.mkdir(exportDir, { recursive: true });
      outputPath = path.join(exportDir, 'dealer_center_import_template.csv');
    }

    await fs.writeFile(outputPath, csv, 'utf8');

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate import template: ${error.message}`);
  }
};

module.exports = {
  exportToDealerCenter,
  generateDealerCenterCSV,
  importFromDealerCenter,
  generateImportTemplate
};
