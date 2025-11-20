const fs = require('fs').promises;
const path = require('path');
const { create } = require('xmlbuilder2');

/**
 * Export inventory to AutoTrader VAUTO XML format
 * @param {Array} vehicles - Array of vehicle objects from database
 * @param {object} dealerInfo - Dealer information
 * @param {string} outputPath - Output file path
 * @returns {Promise<object>} - Export results
 */
const exportToAutoTrader = async (vehicles, dealerInfo = {}, outputPath = null) => {
  try {
    const xml = generateAutoTraderXML(vehicles, dealerInfo);

    // Default output path
    if (!outputPath) {
      const exportDir = path.resolve(__dirname, '../../../exports/autotrader');
      await fs.mkdir(exportDir, { recursive: true });
      outputPath = path.join(exportDir, `autotrader_${Date.now()}.xml`);
    }

    await fs.writeFile(outputPath, xml, 'utf8');

    return {
      success: true,
      filePath: outputPath,
      vehicleCount: vehicles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`AutoTrader export failed: ${error.message}`);
  }
};

/**
 * Generate AutoTrader XML
 * @param {Array} vehicles - Array of vehicle objects
 * @param {object} dealerInfo - Dealer information
 * @returns {string} - XML string
 */
const generateAutoTraderXML = (vehicles, dealerInfo) => {
  const {
    dealerId = process.env.AUTOTRADER_DEALER_ID || 'JP_AUTO',
    dealerName = 'JP Auto',
    phone = '(916) 618-7197',
    email = 'info@jpautomotivegroup.com',
    address = 'Sacramento, CA',
    websiteUrl = 'https://jpautomotivegroup.com'
  } = dealerInfo;

  // Root element
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('AdfInventory', {
      'xmlns': 'http://www.starstandard.org/STAR/5',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    });

  // Dealer information
  const dealer = root.ele('Dealer');
  dealer.ele('DealerId').txt(dealerId);
  dealer.ele('DealerName').txt(dealerName);
  dealer.ele('Phone').txt(phone);
  dealer.ele('Email').txt(email);
  dealer.ele('Address').txt(address);
  dealer.ele('WebsiteUrl').txt(websiteUrl);

  // Inventory items
  const inventory = root.ele('Inventory');

  vehicles.forEach(vehicle => {
    const item = inventory.ele('Vehicle');

    // Basic Info
    item.ele('Year').txt(vehicle.year.toString());
    item.ele('Make').txt(vehicle.make);
    item.ele('Model').txt(vehicle.model);
    if (vehicle.trim) item.ele('Trim').txt(vehicle.trim);
    item.ele('VIN').txt(vehicle.vin);
    if (vehicle.stockNumber) item.ele('StockNumber').txt(vehicle.stockNumber);

    // Status
    item.ele('Status').txt(vehicle.status === 'available' ? 'AVAILABLE' : 'UNAVAILABLE');
    if (vehicle.featured) item.ele('Featured').txt('true');

    // Pricing
    item.ele('Price', { currency: 'USD' }).txt(vehicle.price.toString());
    if (vehicle.msrp) item.ele('MSRP', { currency: 'USD' }).txt(vehicle.msrp.toString());

    // Details
    item.ele('Mileage').txt(vehicle.mileage.toString());
    if (vehicle.exteriorColor) item.ele('ExteriorColor').txt(vehicle.exteriorColor);
    if (vehicle.interiorColor) item.ele('InteriorColor').txt(vehicle.interiorColor);
    if (vehicle.transmission) item.ele('Transmission').txt(vehicle.transmission);
    if (vehicle.engine) item.ele('Engine').txt(vehicle.engine);
    if (vehicle.fuelType) item.ele('FuelType').txt(vehicle.fuelType);
    if (vehicle.drivetrain) item.ele('Drivetrain').txt(vehicle.drivetrain);
    if (vehicle.bodyType) item.ele('BodyType').txt(vehicle.bodyType);
    if (vehicle.doors) item.ele('Doors').txt(vehicle.doors.toString());
    if (vehicle.titleStatus) item.ele('TitleStatus').txt(vehicle.titleStatus);

    // Performance
    if (vehicle.mpgCity) item.ele('MPGCity').txt(vehicle.mpgCity.toString());
    if (vehicle.mpgHighway) item.ele('MPGHighway').txt(vehicle.mpgHighway.toString());
    if (vehicle.horsepower) item.ele('Horsepower').txt(vehicle.horsepower.toString());

    // Features
    if (vehicle.features && vehicle.features.length > 0) {
      const features = item.ele('Features');
      vehicle.features.forEach(feature => {
        features.ele('Feature').txt(feature);
      });
    }

    // Images
    if (vehicle.images && vehicle.images.length > 0) {
      const images = item.ele('Images');
      vehicle.images.forEach((imageUrl, index) => {
        images.ele('Image', { sequence: (index + 1).toString() })
          .txt(imageUrl);
      });
    }

    // History
    if (vehicle.previousOwners) item.ele('PreviousOwners').txt(vehicle.previousOwners.toString());
    if (vehicle.accidentHistory) item.ele('AccidentHistory').txt(vehicle.accidentHistory);
    if (vehicle.carfaxAvailable) {
      item.ele('CarfaxAvailable').txt('true');
      if (vehicle.carfaxUrl) item.ele('CarfaxUrl').txt(vehicle.carfaxUrl);
    }

    // Description
    if (vehicle.description) item.ele('Description').txt(vehicle.description);

    // Warranty
    if (vehicle.warrantyDescription) item.ele('Warranty').txt(vehicle.warrantyDescription);

    // Contact
    const contact = item.ele('Contact');
    contact.ele('Phone').txt(phone);
    contact.ele('Email').txt(email);
  });

  return root.end({ prettyPrint: true });
};

/**
 * Validate vehicle data for AutoTrader
 * @param {object} vehicle - Vehicle object
 * @returns {object} - Validation result
 */
const validateVehicle = (vehicle) => {
  const errors = [];

  // Required fields
  if (!vehicle.year) errors.push('Year is required');
  if (!vehicle.make) errors.push('Make is required');
  if (!vehicle.model) errors.push('Model is required');
  if (!vehicle.vin || vehicle.vin.length !== 17) errors.push('Valid VIN (17 characters) is required');
  if (!vehicle.price || vehicle.price <= 0) errors.push('Valid price is required');
  if (!vehicle.mileage && vehicle.mileage !== 0) errors.push('Mileage is required');

  // Recommended fields
  const warnings = [];
  if (!vehicle.images || vehicle.images.length === 0) warnings.push('No images - listing may not perform well');
  if (!vehicle.description) warnings.push('No description provided');
  if (!vehicle.transmission) warnings.push('Transmission not specified');
  if (!vehicle.exteriorColor) warnings.push('Exterior color not specified');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

module.exports = {
  exportToAutoTrader,
  generateAutoTraderXML,
  validateVehicle
};
