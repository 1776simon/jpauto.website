const fs = require('fs').promises;
const path = require('path');
const { create } = require('xmlbuilder2');

/**
 * Export inventory to CarGurus XML format
 * @param {Array} vehicles - Array of vehicle objects from database
 * @param {object} dealerInfo - Dealer information
 * @param {string} outputPath - Output file path
 * @returns {Promise<object>} - Export results
 */
const exportToCarGurus = async (vehicles, dealerInfo = {}, outputPath = null) => {
  try {
    const xml = generateCarGurusXML(vehicles, dealerInfo);

    // Default output path
    if (!outputPath) {
      const exportDir = path.resolve(__dirname, '../../../exports/cargurus');
      await fs.mkdir(exportDir, { recursive: true });
      outputPath = path.join(exportDir, `cargurus_${Date.now()}.xml`);
    }

    await fs.writeFile(outputPath, xml, 'utf8');

    return {
      success: true,
      filePath: outputPath,
      vehicleCount: vehicles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`CarGurus export failed: ${error.message}`);
  }
};

/**
 * Generate CarGurus XML
 * @param {Array} vehicles - Array of vehicle objects
 * @param {object} dealerInfo - Dealer information
 * @returns {string} - XML string
 */
const generateCarGurusXML = (vehicles, dealerInfo) => {
  const {
    dealerId = process.env.CARGURUS_DEALER_ID || 'JP_AUTO',
    dealerName = 'JP Auto',
    phone = '(916) 618-7197',
    email = 'info@jpautomotivegroup.com',
    address = 'Sacramento',
    city = 'Sacramento',
    state = 'CA',
    zip = '',
    websiteUrl = 'https://jpautomotivegroup.com'
  } = dealerInfo;

  // Root element with CarGurus specific namespace
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('feed', {
      'xmlns': 'http://www.cargurus.com/cars/XML',
      'version': '2.0'
    });

  // Dealer information
  root.ele('dealer_id').txt(dealerId);
  root.ele('dealer_name').txt(dealerName);

  // Listings
  vehicles.forEach(vehicle => {
    const listing = root.ele('listing');

    // Identification
    listing.ele('vin').txt(vehicle.vin);
    if (vehicle.stockNumber) listing.ele('stock_number').txt(vehicle.stockNumber);

    // Vehicle Info
    listing.ele('year').txt(vehicle.year.toString());
    listing.ele('make').txt(vehicle.make);
    listing.ele('model').txt(vehicle.model);
    if (vehicle.trim) listing.ele('trim').txt(vehicle.trim);

    // Pricing
    listing.ele('price').txt(Math.round(vehicle.price).toString());
    if (vehicle.msrp) listing.ele('msrp').txt(Math.round(vehicle.msrp).toString());

    // Details
    listing.ele('mileage').txt(vehicle.mileage.toString());
    if (vehicle.exteriorColor) listing.ele('exterior_color').txt(vehicle.exteriorColor);
    if (vehicle.interiorColor) listing.ele('interior_color').txt(vehicle.interiorColor);
    if (vehicle.transmission) listing.ele('transmission').txt(mapTransmission(vehicle.transmission));
    if (vehicle.engine) listing.ele('engine').txt(vehicle.engine);
    if (vehicle.fuelType) listing.ele('fuel_type').txt(mapFuelType(vehicle.fuelType));
    if (vehicle.drivetrain) listing.ele('drivetrain').txt(mapDrivetrain(vehicle.drivetrain));
    if (vehicle.bodyType) listing.ele('body_type').txt(vehicle.bodyType);
    if (vehicle.doors) listing.ele('doors').txt(vehicle.doors.toString());

    // Condition
    listing.ele('condition').txt('Used');
    if (vehicle.titleStatus) listing.ele('title_status').txt(vehicle.titleStatus);

    // Performance
    if (vehicle.mpgCity) listing.ele('mpg_city').txt(vehicle.mpgCity.toString());
    if (vehicle.mpgHighway) listing.ele('mpg_highway').txt(vehicle.mpgHighway.toString());

    // Features - CarGurus wants a comma-separated string
    if (vehicle.features && vehicle.features.length > 0) {
      listing.ele('features').txt(vehicle.features.join(', '));
    }

    // Images - CarGurus allows up to 50 images
    if (vehicle.images && vehicle.images.length > 0) {
      vehicle.images.slice(0, 50).forEach((imageUrl, index) => {
        listing.ele('image', { sequence: (index + 1).toString() }).txt(imageUrl);
      });
    }

    // History
    if (vehicle.previousOwners) listing.ele('previous_owners').txt(vehicle.previousOwners.toString());
    if (vehicle.accidentHistory && vehicle.accidentHistory.toLowerCase() !== 'none') {
      listing.ele('accident_history').txt('true');
    }

    // Carfax
    if (vehicle.carfaxAvailable) {
      listing.ele('carfax_available').txt('true');
      if (vehicle.carfaxUrl) listing.ele('carfax_link').txt(vehicle.carfaxUrl);
    }

    // Description
    if (vehicle.description) {
      // CarGurus has a character limit on descriptions
      const description = vehicle.description.substring(0, 1000);
      listing.ele('description').txt(description);
    }

    // Warranty
    if (vehicle.warrantyDescription) {
      listing.ele('warranty').txt(vehicle.warrantyDescription);
    }

    // Dealer contact for this listing
    listing.ele('dealer_name').txt(dealerName);
    listing.ele('dealer_phone').txt(phone);
    listing.ele('dealer_email').txt(email);
    listing.ele('dealer_street').txt(address);
    listing.ele('dealer_city').txt(city);
    listing.ele('dealer_state').txt(state);
    if (zip) listing.ele('dealer_zip').txt(zip);
    listing.ele('dealer_website').txt(websiteUrl);

    // Listing URL
    const vehicleSlug = `${vehicle.year}-${vehicle.make}-${vehicle.model}`.toLowerCase().replace(/\s+/g, '-');
    listing.ele('listing_url').txt(`${websiteUrl}/vehicles/${vehicleSlug}`);

    // Status - only export available vehicles
    if (vehicle.status === 'available') {
      listing.ele('status').txt('Active');
    } else {
      listing.ele('status').txt('Inactive');
    }
  });

  return root.end({ prettyPrint: true });
};

/**
 * Map transmission values to CarGurus format
 */
const mapTransmission = (transmission) => {
  if (!transmission) return 'Unknown';

  const trans = transmission.toLowerCase();
  if (trans.includes('automatic') || trans.includes('cvt') || trans.includes('auto')) {
    return 'Automatic';
  } else if (trans.includes('manual') || trans.includes('mt')) {
    return 'Manual';
  }
  return transmission;
};

/**
 * Map fuel type to CarGurus format
 */
const mapFuelType = (fuelType) => {
  if (!fuelType) return 'Gasoline';

  const fuel = fuelType.toLowerCase();
  if (fuel.includes('gas') || fuel.includes('petrol')) return 'Gasoline';
  if (fuel.includes('diesel')) return 'Diesel';
  if (fuel.includes('electric') || fuel.includes('ev')) return 'Electric';
  if (fuel.includes('hybrid')) return 'Hybrid';
  if (fuel.includes('plug')) return 'Plug-in Hybrid';

  return fuelType;
};

/**
 * Map drivetrain to CarGurus format
 */
const mapDrivetrain = (drivetrain) => {
  if (!drivetrain) return '';

  const dt = drivetrain.toUpperCase();
  if (dt.includes('FWD') || dt.includes('FRONT')) return 'FWD';
  if (dt.includes('RWD') || dt.includes('REAR')) return 'RWD';
  if (dt.includes('AWD') || dt.includes('ALL')) return 'AWD';
  if (dt.includes('4WD') || dt.includes('4X4')) return '4WD';

  return drivetrain;
};

/**
 * Validate vehicle data for CarGurus
 * @param {object} vehicle - Vehicle object
 * @returns {object} - Validation result
 */
const validateVehicle = (vehicle) => {
  const errors = [];

  // Required fields for CarGurus
  if (!vehicle.year) errors.push('Year is required');
  if (!vehicle.make) errors.push('Make is required');
  if (!vehicle.model) errors.push('Model is required');
  if (!vehicle.vin || vehicle.vin.length !== 17) errors.push('Valid VIN (17 characters) is required');
  if (!vehicle.price || vehicle.price <= 0) errors.push('Valid price is required');
  if (!vehicle.mileage && vehicle.mileage !== 0) errors.push('Mileage is required');

  // Recommended fields
  const warnings = [];
  if (!vehicle.images || vehicle.images.length === 0) {
    warnings.push('No images - CarGurus listings require at least 1 image');
  }
  if (!vehicle.description) warnings.push('No description - highly recommended for better listing performance');
  if (!vehicle.exteriorColor) warnings.push('Exterior color not specified');
  if (!vehicle.transmission) warnings.push('Transmission not specified');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

module.exports = {
  exportToCarGurus,
  generateCarGurusXML,
  validateVehicle
};
