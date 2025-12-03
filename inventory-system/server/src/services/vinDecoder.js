/**
 * VIN Decoder Service using Auto.dev API
 *
 * This service decodes VINs and retrieves vehicle specifications including:
 * - Year, Make, Model, Trim
 * - Engine specifications
 * - Drivetrain type
 * - MPG (City/Highway)
 * - Body type, Transmission, Fuel type
 *
 * API Documentation: https://docs.auto.dev
 */

const logger = require('../config/logger');

class VINDecoderService {
  constructor() {
    this.apiKey = process.env.AUTO_DEV_API_KEY;
    this.baseURL = 'https://api.auto.dev';

    if (!this.apiKey) {
      logger.warn('AUTO_DEV_API_KEY not configured. VIN decoding will not be available.');
    }
  }

  /**
   * Decode a VIN using Auto.dev API
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

    // Check if API key is configured
    if (!this.apiKey) {
      throw new Error('VIN decoder not configured. Please contact administrator.');
    }

    try {
      logger.info(`Decoding VIN: ${cleanVIN}`);

      // Call Auto.dev VIN Decoder API
      const response = await fetch(`${this.baseURL}/v1/vin/${cleanVIN}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Auto.dev API error: ${response.status} - ${errorText}`);

        if (response.status === 401) {
          throw new Error('Invalid API key');
        } else if (response.status === 404) {
          throw new Error('VIN not found in database');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Failed to decode VIN: ${response.statusText}`);
        }
      }

      const data = await response.json();

      // Extract and normalize the relevant fields
      const decodedData = this.normalizeVehicleData(data);

      logger.info(`Successfully decoded VIN: ${cleanVIN} - ${decodedData.year} ${decodedData.make} ${decodedData.model}`);

      return decodedData;
    } catch (error) {
      logger.error(`VIN decode error for ${cleanVIN}:`, error);
      throw error;
    }
  }

  /**
   * Normalize Auto.dev response to our internal format
   * @param {Object} apiData - Raw API response
   * @returns {Object} Normalized vehicle data
   */
  normalizeVehicleData(apiData) {
    // Auto.dev API response structure may vary, adjust as needed
    // This is based on common Auto.dev API response format

    return {
      // Basic Information
      year: this.extractValue(apiData, ['year', 'model_year']),
      make: this.extractValue(apiData, ['make', 'manufacturer']),
      model: this.extractValue(apiData, ['model']),
      trim: this.extractValue(apiData, ['trim', 'trim_level']),

      // Engine & Performance
      engine: this.extractEngineDescription(apiData),
      drivetrain: this.normalizeDrivetrain(
        this.extractValue(apiData, ['drivetrain', 'drive_type', 'drive'])
      ),
      transmission: this.extractValue(apiData, ['transmission', 'transmission_type']),
      horsepower: this.extractValue(apiData, ['horsepower', 'hp']),

      // Fuel Economy
      mpgCity: this.extractValue(apiData, ['mpg_city', 'city_mpg', 'fuel_economy.city']),
      mpgHighway: this.extractValue(apiData, ['mpg_highway', 'highway_mpg', 'fuel_economy.highway']),
      fuelType: this.extractValue(apiData, ['fuel_type', 'fuel']),

      // Physical Attributes
      bodyType: this.extractValue(apiData, ['body_type', 'body_style', 'style']),
      exteriorColor: this.extractValue(apiData, ['exterior_color', 'color']),
      interiorColor: this.extractValue(apiData, ['interior_color']),
      doors: this.extractValue(apiData, ['doors', 'door_count']),

      // Raw data for debugging
      _rawData: apiData
    };
  }

  /**
   * Extract value from nested object using multiple possible paths
   * @param {Object} obj - Object to search
   * @param {Array<string>} paths - Possible paths to value
   * @returns {any} Extracted value or null
   */
  extractValue(obj, paths) {
    for (const path of paths) {
      // Handle dot notation (e.g., 'fuel_economy.city')
      const keys = path.split('.');
      let value = obj;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          value = null;
          break;
        }
      }

      if (value !== null && value !== undefined && value !== '' && value !== 'Not Applicable') {
        return value;
      }
    }

    return null;
  }

  /**
   * Extract and format engine description
   * @param {Object} apiData - API response data
   * @returns {string|null} Formatted engine description
   */
  extractEngineDescription(apiData) {
    // Try to build a comprehensive engine description
    const displacement = this.extractValue(apiData, ['engine_displacement', 'displacement', 'engine_size']);
    const cylinders = this.extractValue(apiData, ['cylinders', 'cylinder_count', 'engine_cylinders']);
    const engineType = this.extractValue(apiData, ['engine_type', 'engine']);
    const aspiration = this.extractValue(apiData, ['aspiration', 'turbo', 'supercharged']);

    // Build description from available parts
    let description = '';

    if (displacement) {
      description += `${displacement}L `;
    }

    if (cylinders) {
      description += `${cylinders}-Cylinder `;
    }

    if (aspiration && aspiration.toLowerCase() !== 'naturally aspirated') {
      description += `${aspiration} `;
    }

    if (engineType && !description.includes(engineType)) {
      description += engineType;
    }

    return description.trim() || this.extractValue(apiData, ['engine_description', 'engine']);
  }

  /**
   * Normalize drivetrain to standard values (AWD, RWD, FWD)
   * @param {string} drivetrain - Raw drivetrain value
   * @returns {string|null} Normalized drivetrain
   */
  normalizeDrivetrain(drivetrain) {
    if (!drivetrain) return null;

    const normalized = drivetrain.toUpperCase();

    // Map various formats to standard values
    if (normalized.includes('AWD') || normalized.includes('ALL') || normalized.includes('4WD') || normalized.includes('FOUR')) {
      return 'AWD';
    } else if (normalized.includes('RWD') || normalized.includes('REAR')) {
      return 'RWD';
    } else if (normalized.includes('FWD') || normalized.includes('FRONT')) {
      return 'FWD';
    }

    return drivetrain; // Return original if no match
  }
}

// Export singleton instance
module.exports = new VINDecoderService();
