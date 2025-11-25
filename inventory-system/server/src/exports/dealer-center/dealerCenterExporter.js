const fs = require('fs').promises;
const path = require('path');
const { parse } = require('json2csv');
const dealerCenterConfig = require('../../config/dealerCenter');

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
      const filename = typeof dealerCenterConfig.export.getFilename === 'function'
        ? dealerCenterConfig.export.getFilename()
        : dealerCenterConfig.export.filename || 'dealer-center-export.csv';
      outputPath = path.join(exportDir, filename);
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
 * Based on DealerCenter File Import Mapping template
 * @param {Array} vehicles - Array of vehicle objects
 * @returns {string} - CSV string
 */
const generateDealerCenterCSV = (vehicles) => {
  const { dealer } = dealerCenterConfig;

  // Map vehicles to DealerCenter format
  const dealerCenterVehicles = vehicles.map(vehicle => {
    // Generate VDP (Vehicle Detail Page) URL
    const vdpUrl = vehicle.stockNumber
      ? `https://jpautomotivegroup.com/vehicles/${vehicle.stockNumber.toLowerCase()}`
      : '';

    // Format photo URLs (pipe-separated as per DMS standard)
    const photoURLs = vehicle.images && vehicle.images.length > 0
      ? vehicle.images.join('|')
      : '';

    // Format latest photo modified date
    const latestPhotoModified = vehicle.latestPhotoModified
      ? new Date(vehicle.latestPhotoModified).toISOString().split('T')[0]
      : '';

    return {
      'DealerID': dealer.id,
      'DealerName': dealer.name,
      'Address': dealer.address,
      'City': dealer.city,
      'State': dealer.state,
      'Zip': dealer.zip,
      'Phone': dealer.phone,
      'StockNumber': vehicle.stockNumber || '',
      'VIN': vehicle.vin,
      'Year': vehicle.year,
      'Make': vehicle.make,
      'Model': vehicle.model,
      'Trim': vehicle.trim || '',
      'Odometer': vehicle.mileage,
      'Price': Math.round(vehicle.price),
      'Exterior Color': vehicle.exteriorColor || '',
      'InteriorColor': vehicle.interiorColor || '',
      'Transmission': vehicle.transmission || '',
      'PhotoURLs': photoURLs,
      'WebAdDescription': generateWebAdDescription(vehicle),
      'VDP': vdpUrl,
      'FuelType': vehicle.fuelType || '',
      'Description': vehicle.description || '',
      'LatestPhotoModifiedDate': latestPhotoModified
    };
  });

  // Use fields from config
  const fields = dealerCenterConfig.csvFields;

  const csv = parse(dealerCenterVehicles, { fields });

  return csv;
};

/**
 * Generate web ad description from vehicle data
 * @param {object} vehicle - Vehicle object
 * @returns {string} - Formatted description
 */
const generateWebAdDescription = (vehicle) => {
  const parts = [];

  // Basic info
  parts.push(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
  if (vehicle.trim) parts.push(vehicle.trim);

  // Key details
  if (vehicle.mileage) parts.push(`${vehicle.mileage.toLocaleString()} miles`);
  if (vehicle.transmission) parts.push(vehicle.transmission);
  if (vehicle.fuelType) parts.push(vehicle.fuelType);
  if (vehicle.exteriorColor) parts.push(`${vehicle.exteriorColor} exterior`);

  // Description snippet
  if (vehicle.description) {
    const snippet = vehicle.description.substring(0, 100);
    parts.push(snippet + (vehicle.description.length > 100 ? '...' : ''));
  }

  return parts.join(' | ');
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
