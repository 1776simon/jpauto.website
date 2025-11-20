const fs = require('fs').promises;
const path = require('path');
const { parse } = require('json2csv');

/**
 * Export inventory to Facebook Marketplace CSV format
 * @param {Array} vehicles - Array of vehicle objects from database
 * @param {object} dealerInfo - Dealer information
 * @param {string} outputPath - Output file path
 * @returns {Promise<object>} - Export results
 */
const exportToFacebook = async (vehicles, dealerInfo = {}, outputPath = null) => {
  try {
    const csv = generateFacebookCSV(vehicles, dealerInfo);

    // Default output path
    if (!outputPath) {
      const exportDir = path.resolve(__dirname, '../../../exports/facebook');
      await fs.mkdir(exportDir, { recursive: true });
      outputPath = path.join(exportDir, `facebook_marketplace_${Date.now()}.csv`);
    }

    await fs.writeFile(outputPath, csv, 'utf8');

    return {
      success: true,
      filePath: outputPath,
      vehicleCount: vehicles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Facebook export failed: ${error.message}`);
  }
};

/**
 * Generate Facebook Marketplace CSV
 * @param {Array} vehicles - Array of vehicle objects
 * @param {object} dealerInfo - Dealer information
 * @returns {string} - CSV string
 */
const generateFacebookCSV = (vehicles, dealerInfo) => {
  const {
    dealerName = 'JP Auto',
    address = 'Sacramento, CA',
    phone = '(916) 618-7197',
    websiteUrl = 'https://jpautomotivegroup.com'
  } = dealerInfo;

  // Map vehicles to Facebook format
  const facebookVehicles = vehicles.map(vehicle => {
    const vehicleSlug = `${vehicle.year}-${vehicle.make}-${vehicle.model}-${vehicle.vin.slice(-6)}`.toLowerCase().replace(/\s+/g, '-');

    return {
      // Required fields
      'id': vehicle.vin,
      'title': vehicle.marketingTitle || `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim(),
      'availability': vehicle.status === 'available' ? 'in stock' : 'out of stock',
      'condition': 'used',
      'description': vehicle.description ? vehicle.description.substring(0, 5000) : '',
      'price': Math.round(vehicle.price),
      'currency': 'USD',
      'url': `${websiteUrl}/vehicles/${vehicleSlug}`,

      // Vehicle details
      'year': vehicle.year,
      'make': vehicle.make,
      'model': vehicle.model,
      'trim': vehicle.trim || '',
      'body_style': vehicle.bodyType || '',
      'mileage': {
        value: vehicle.mileage,
        unit: 'mi'
      },
      'vin': vehicle.vin,

      // Colors
      'exterior_color': vehicle.exteriorColor || '',
      'interior_color': vehicle.interiorColor || '',

      // Mechanical
      'transmission': vehicle.transmission || '',
      'fuel_type': mapFuelType(vehicle.fuelType),
      'drivetrain': vehicle.drivetrain || '',

      // Performance
      'mpg_city': vehicle.mpgCity || '',
      'mpg_highway': vehicle.mpgHighway || '',

      // Images - Facebook allows multiple images separated by comma
      'image_link': vehicle.primaryImageUrl || (vehicle.images && vehicle.images[0]) || '',
      'additional_image_link': vehicle.images ? vehicle.images.slice(1).join(',') : '',

      // Dealer info
      'dealer_name': dealerName,
      'dealer_phone': phone,
      'address': address,

      // Features
      'features': vehicle.features && vehicle.features.length > 0 ? vehicle.features.join(', ') : '',

      // History
      'carfax_available': vehicle.carfaxAvailable ? 'yes' : 'no',
      'carfax_url': vehicle.carfaxUrl || '',

      // State/city (for local inventory)
      'state_of_vehicle': 'CA',
      'city_of_vehicle': 'Sacramento',

      // Title status
      'title_status': vehicle.titleStatus || 'clean'
    };
  });

  // Define CSV fields (Facebook Marketplace format)
  const fields = [
    'id',
    'title',
    'availability',
    'condition',
    'description',
    'price',
    'currency',
    'url',
    'year',
    'make',
    'model',
    'trim',
    'body_style',
    'mileage',
    'vin',
    'exterior_color',
    'interior_color',
    'transmission',
    'fuel_type',
    'drivetrain',
    'mpg_city',
    'mpg_highway',
    'image_link',
    'additional_image_link',
    'dealer_name',
    'dealer_phone',
    'address',
    'features',
    'carfax_available',
    'carfax_url',
    'state_of_vehicle',
    'city_of_vehicle',
    'title_status'
  ];

  const csv = parse(facebookVehicles, { fields });

  return csv;
};

/**
 * Map fuel type to Facebook format
 */
const mapFuelType = (fuelType) => {
  if (!fuelType) return 'gasoline';

  const fuel = fuelType.toLowerCase();
  if (fuel.includes('gas') || fuel.includes('petrol')) return 'gasoline';
  if (fuel.includes('diesel')) return 'diesel';
  if (fuel.includes('electric') || fuel.includes('ev')) return 'electric';
  if (fuel.includes('hybrid')) return 'hybrid';
  if (fuel.includes('plug')) return 'plug_in_hybrid';
  if (fuel.includes('flex')) return 'flex_fuel';

  return 'gasoline';
};

/**
 * Validate vehicle data for Facebook Marketplace
 * @param {object} vehicle - Vehicle object
 * @returns {object} - Validation result
 */
const validateVehicle = (vehicle) => {
  const errors = [];

  // Required fields for Facebook
  if (!vehicle.vin) errors.push('VIN is required');
  if (!vehicle.year) errors.push('Year is required');
  if (!vehicle.make) errors.push('Make is required');
  if (!vehicle.model) errors.push('Model is required');
  if (!vehicle.price || vehicle.price <= 0) errors.push('Valid price is required');
  if (!vehicle.mileage && vehicle.mileage !== 0) errors.push('Mileage is required');

  // Facebook requires at least one image
  if (!vehicle.images || vehicle.images.length === 0) {
    errors.push('At least one image is required for Facebook Marketplace');
  }

  // Recommended fields
  const warnings = [];
  if (!vehicle.description) warnings.push('Description is highly recommended');
  if (!vehicle.exteriorColor) warnings.push('Exterior color not specified');
  if (!vehicle.transmission) warnings.push('Transmission not specified');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

module.exports = {
  exportToFacebook,
  generateFacebookCSV,
  validateVehicle
};
