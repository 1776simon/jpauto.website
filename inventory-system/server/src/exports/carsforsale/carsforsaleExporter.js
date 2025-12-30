const fs = require('fs').promises;
const path = require('path');
const { parse } = require('json2csv');
const carsforsaleConfig = require('../../config/carsforsale');

/**
 * Export inventory to CarsForSale.com format
 * @param {Array} vehicles - Array of vehicle objects from database
 * @param {string} outputPath - Output file path
 * @returns {Promise<object>} - Export results
 */
const exportToCarsForSale = async (vehicles, outputPath = null) => {
  try {
    const csv = generateCarsForSaleCSV(vehicles);

    // Default output path
    if (!outputPath) {
      const exportDir = path.resolve(__dirname, '../../../exports/carsforsale');
      await fs.mkdir(exportDir, { recursive: true });
      const filename = carsforsaleConfig.export.filename || 'inventory.txt';
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
    throw new Error(`CarsForSale export failed: ${error.message}`);
  }
};

/**
 * Generate CarsForSale.com CSV
 * Based on CarsForSale.com Standard Data Feed format
 * @param {Array} vehicles - Array of vehicle objects
 * @returns {string} - CSV string
 */
const generateCarsForSaleCSV = (vehicles) => {
  const { dealer } = carsforsaleConfig;

  // Map vehicles to CarsForSale format
  const carsforsaleVehicles = vehicles.map(vehicle => {
    // Format photo URLs (comma-separated, include ALL images)
    const photoURLs = vehicle.images && vehicle.images.length > 0
      ? vehicle.images.join(',')
      : '';

    // Format options from features array (comma-separated)
    const options = vehicle.features && vehicle.features.length > 0
      ? vehicle.features.join(', ')
      : '';

    // Clean and truncate description (max 4000 chars)
    const description = vehicle.description
      ? cleanDescription(vehicle.description).substring(0, 4000)
      : '';

    return {
      'CarsForSaleDealerID': dealer.id,
      'NewUsed': 'U', // All vehicles are Used
      'VIN': vehicle.vin,
      'StockNumber': vehicle.stockNumber || vehicle.stock_number || '',
      'Make': vehicle.make,
      'Model': vehicle.model,
      'ModelYear': vehicle.year,
      'Trim/Package': vehicle.trim || '',
      'BodyStyle': formatBodyStyle(vehicle.bodyStyle || vehicle.body_style),
      'Miles': vehicle.mileage,
      'Engine': vehicle.engine || '',
      'Cylinders': '', // Left empty - CarsForSale will decode from VIN
      'FuelType': vehicle.fuelType || vehicle.fuel_type || '',
      'Transmission': vehicle.transmission || '',
      'Price': Math.round(vehicle.price),
      'ExteriorColor': vehicle.exteriorColor || vehicle.exterior_color || '',
      'InteriorColor': vehicle.interiorColor || vehicle.interior_color || '',
      'Options': options,
      'Description': description,
      'PhotoURLs': photoURLs
    };
  });

  // Use fields from config
  const fields = carsforsaleConfig.csvFields;

  // Generate CSV without headers (as per CarsForSale spec)
  const csv = parse(carsforsaleVehicles, {
    fields,
    header: false // No header row
  });

  return csv;
};

/**
 * Format body style to match CarsForSale.com expected values
 * @param {string} bodyStyle - Raw body style from database
 * @returns {string} - Formatted body style
 */
const formatBodyStyle = (bodyStyle) => {
  if (!bodyStyle) return '';

  // Normalize to CarsForSale expected values (Sedan, Coupe, SUV, etc)
  const bodyStyleMap = {
    'sedan': 'Sedan',
    'coupe': 'Coupe',
    'suv': 'SUV',
    'truck': 'Truck',
    'pickup': 'Truck',
    'van': 'Van',
    'minivan': 'Minivan',
    'wagon': 'Wagon',
    'hatchback': 'Hatchback',
    'convertible': 'Convertible',
    'crossover': 'SUV'
  };

  const normalized = bodyStyle.toLowerCase().trim();
  return bodyStyleMap[normalized] || bodyStyle;
};

/**
 * Clean description for CarsForSale format
 * Remove ALL formatting - convert to plain text only
 * @param {string} description - Raw description
 * @returns {string} - Cleaned plain text description
 */
const cleanDescription = (description) => {
  if (!description) return '';

  let cleaned = description.trim();

  // Remove ALL HTML tags (no line break preservation)
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Remove all line breaks and convert to spaces
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');

  // Normalize all whitespace to single spaces
  cleaned = cleaned.replace(/\s+/g, ' ');

  return cleaned.trim();
};

module.exports = {
  exportToCarsForSale,
  generateCarsForSaleCSV
};
