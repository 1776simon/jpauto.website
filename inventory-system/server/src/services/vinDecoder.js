/**
 * VIN Decoder Service using NHTSA API + EPA Fuel Economy API
 *
 * This service decodes VINs and retrieves vehicle specifications including:
 * - Year, Make, Model, Trim (from NHTSA)
 * - Engine specifications (displacement, cylinders) (from NHTSA)
 * - Drivetrain type (from NHTSA)
 * - Body type, Transmission, Fuel type (from NHTSA)
 * - MPG City/Highway (from EPA FuelEconomy.gov)
 *
 * APIs:
 * - NHTSA vPIC: https://vpic.nhtsa.dot.gov/api/
 * - EPA FuelEconomy.gov: https://www.fueleconomy.gov/feg/ws/
 * Rate Limit: None (both free, unlimited)
 */

const logger = require('../config/logger');
const epaService = require('./epaFuelEconomy');

class VINDecoderService {
  constructor() {
    this.baseURL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
  }

  /**
   * Decode a VIN using NHTSA API
   * @param {string} vin - 17-character VIN
   * @returns {Promise<Object>} Decoded vehicle data
   */
  async decodeVIN(vin) {
    // Validate VIN format
    if (!vin || typeof vin !== 'string') {
      throw new Error('VIN must be a string');
    }

    const cleanVIN = vin.trim().toUpperCase();

    if (cleanVIN.length !== 17) {
      throw new Error('VIN must be exactly 17 characters');
    }

    try {
      logger.info(`Decoding VIN: ${cleanVIN}`);

      // Call NHTSA VIN Decoder API
      const response = await fetch(`${this.baseURL}/DecodeVin/${cleanVIN}?format=json`);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`NHTSA API error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to decode VIN: ${response.statusText}`);
      }

      const data = await response.json();

      // NHTSA returns data in Results array
      if (!data.Results || data.Results.length === 0) {
        throw new Error('VIN not found in NHTSA database');
      }

      // Log the raw response for debugging
      logger.info(`Raw NHTSA response for VIN ${cleanVIN}:`, JSON.stringify(data, null, 2));

      // Extract and normalize the relevant fields from NHTSA
      const decodedData = this.normalizeVehicleData(data.Results);

      logger.info(`Successfully decoded VIN: ${cleanVIN} - ${decodedData.year} ${decodedData.make} ${decodedData.model}`);

      // Try to get MPG data from EPA (if year/make/model are available)
      if (decodedData.year && decodedData.make && decodedData.model) {
        try {
          const mpgData = await epaService.getMPG({
            year: decodedData.year,
            make: decodedData.make,
            model: decodedData.model,
            engine: decodedData.engine
          });

          // Merge MPG data into decoded data
          decodedData.mpgCity = mpgData.mpgCity;
          decodedData.mpgHighway = mpgData.mpgHighway;
        } catch (epaError) {
          // Log EPA error but don't fail the entire decode
          logger.warn(`EPA lookup failed for ${decodedData.year} ${decodedData.make} ${decodedData.model}:`, epaError.message);
          // MPG values will remain null (already set in normalizeVehicleData)
        }
      }

      logger.info(`Final decoded data:`, JSON.stringify(decodedData, null, 2));

      return decodedData;
    } catch (error) {
      logger.error(`VIN decode error for ${cleanVIN}:`, error);
      throw error;
    }
  }

  /**
   * Normalize NHTSA response to our internal format
   * @param {Array} results - NHTSA Results array
   * @returns {Object} Normalized vehicle data
   */
  normalizeVehicleData(results) {
    return {
      // Basic Information
      year: this.getValueByVariable(results, 'Model Year'),
      make: this.getValueByVariable(results, 'Make'),
      model: this.getValueByVariable(results, 'Model'),
      trim: this.getValueByVariable(results, 'Trim') || this.getValueByVariable(results, 'Trim2'),

      // Engine & Performance
      engine: this.buildEngineDescription(results),
      drivetrain: this.normalizeDrivetrain(
        this.getValueByVariable(results, 'Drive Type'),
        results
      ),
      transmission: this.getValueByVariable(results, 'Transmission Style') ||
                     this.getValueByVariable(results, 'Transmission Speeds'),
      horsepower: this.getValueByVariable(results, 'Engine Brake (hp)'),

      // Fuel Economy - NHTSA doesn't provide MPG, return null
      mpgCity: null,
      mpgHighway: null,
      fuelType: this.getValueByVariable(results, 'Fuel Type - Primary'),

      // Physical Attributes
      bodyType: this.getValueByVariable(results, 'Body Class'),
      exteriorColor: null, // NHTSA doesn't have this
      interiorColor: null, // NHTSA doesn't have this
      doors: this.getValueByVariable(results, 'Doors'),

      // Additional useful fields from NHTSA
      manufacturer: this.getValueByVariable(results, 'Manufacturer Name'),
      plantCity: this.getValueByVariable(results, 'Plant City'),
      plantCountry: this.getValueByVariable(results, 'Plant Country'),
      series: this.getValueByVariable(results, 'Series'),

      // Raw data for debugging
      _rawData: results
    };
  }

  /**
   * Extract value from NHTSA Results array by Variable name
   * @param {Array} results - NHTSA Results array
   * @param {string} variableName - The Variable field to search for
   * @returns {any} Extracted value or null
   */
  getValueByVariable(results, variableName) {
    const item = results.find(r => r.Variable === variableName);
    const value = item && item.Value;

    // Return null for empty, "Not Applicable", or falsy values
    if (!value || value === 'Not Applicable' || value === '' || value === 'null') {
      return null;
    }

    return value;
  }

  /**
   * Build engine description from NHTSA data
   * @param {Array} results - NHTSA Results array
   * @returns {string|null} Formatted engine description
   */
  buildEngineDescription(results) {
    const displacement = this.getValueByVariable(results, 'Displacement (L)');
    const cylinders = this.getValueByVariable(results, 'Engine Number of Cylinders');
    const configuration = this.getValueByVariable(results, 'Engine Configuration');
    const fuelType = this.getValueByVariable(results, 'Fuel Type - Primary');

    // Build description from available parts
    let description = '';

    if (displacement) {
      description += `${displacement}L `;
    }

    if (cylinders) {
      description += `${cylinders}-Cylinder `;
    }

    if (configuration) {
      description += `${configuration} `;
    }

    if (fuelType && !description.toLowerCase().includes(fuelType.toLowerCase())) {
      description += fuelType;
    }

    const result = description.trim();

    // If we couldn't build a description, try to get it directly
    if (!result) {
      return this.getValueByVariable(results, 'Engine Model') ||
             this.getValueByVariable(results, 'Engine Manufacturer');
    }

    return result || null;
  }

  /**
   * Normalize drivetrain to standard values (AWD, RWD, FWD)
   * Note: 4WD is converted to AWD as they are functionally equivalent for our purposes
   * @param {string} drivetrain - Raw drivetrain value from NHTSA
   * @param {Array} results - Full NHTSA Results array (for context when drivetrain is "4x2")
   * @returns {string|null} Normalized drivetrain
   */
  normalizeDrivetrain(drivetrain, results = []) {
    if (!drivetrain) return null;

    const normalized = drivetrain.toUpperCase();

    // NHTSA returns values like: "AWD/All-Wheel Drive", "FWD/Front-Wheel Drive", etc.
    // Map to our standard values: AWD, RWD, FWD
    // Note: Both 4WD and AWD are mapped to 'AWD' (functionally equivalent)
    if (normalized.includes('AWD') || normalized.includes('ALL-WHEEL') || normalized.includes('ALL WHEEL') ||
        normalized.includes('4WD') || normalized.includes('4X4') || normalized.includes('FOUR-WHEEL') || normalized.includes('FOUR WHEEL')) {
      return 'AWD';
    } else if (normalized.includes('RWD') || normalized.includes('REAR-WHEEL') || normalized.includes('REAR WHEEL')) {
      return 'RWD';
    } else if (normalized.includes('FWD') || normalized.includes('FRONT-WHEEL') || normalized.includes('FRONT WHEEL')) {
      return 'FWD';
    } else if (normalized === '4X2') {
      // 4x2 means 2-wheel drive, but doesn't specify which wheels
      // Use vehicle type to make educated guess:
      // - Trucks/Pickups are typically RWD
      // - Cars/SUVs/Crossovers are typically FWD
      const bodyClass = this.getValueByVariable(results, 'Body Class');
      const vehicleType = this.getValueByVariable(results, 'Vehicle Type');

      if (bodyClass && bodyClass.toUpperCase().includes('PICKUP')) {
        return 'RWD';
      } else if (vehicleType && vehicleType.toUpperCase().includes('TRUCK')) {
        return 'RWD';
      } else {
        // Default to FWD for cars, SUVs, crossovers, hybrids
        return 'FWD';
      }
    }

    return drivetrain; // Return original if no match
  }
}

// Export singleton instance
module.exports = new VINDecoderService();
