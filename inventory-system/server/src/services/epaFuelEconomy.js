/**
 * EPA Fuel Economy Service
 *
 * Retrieves MPG data from the EPA FuelEconomy.gov API based on vehicle year/make/model
 *
 * API: FuelEconomy.gov Web Services
 * Base URL: https://www.fueleconomy.gov/ws/rest/
 * Documentation: https://www.fueleconomy.gov/feg/ws/
 * Rate Limit: None (free, unlimited)
 */

const logger = require('../config/logger');
const xml2js = require('xml2js');

class EPAFuelEconomyService {
  constructor() {
    this.baseURL = 'https://www.fueleconomy.gov/ws/rest';
    this.parser = new xml2js.Parser({ explicitArray: false });
  }

  /**
   * Get fuel economy data for a vehicle
   * @param {Object} vehicleInfo - Vehicle information from NHTSA
   * @param {string} vehicleInfo.year - Model year
   * @param {string} vehicleInfo.make - Manufacturer
   * @param {string} vehicleInfo.model - Model name
   * @param {string} vehicleInfo.engine - Engine description (optional, for matching)
   * @returns {Promise<Object>} MPG data { mpgCity, mpgHighway } or { mpgCity: null, mpgHighway: null }
   */
  async getMPG(vehicleInfo) {
    const { year, make, model, engine } = vehicleInfo;

    // Validate required fields
    if (!year || !make || !model) {
      logger.warn('EPA: Missing required vehicle info (year, make, or model)');
      return { mpgCity: null, mpgHighway: null };
    }

    try {
      logger.info(`EPA: Looking up MPG for ${year} ${make} ${model}`);

      // Step 1: Get vehicle options (which includes vehicle IDs)
      const options = await this.getVehicleOptions(year, make, model);

      if (!options || options.length === 0) {
        logger.warn(`EPA: No options found for ${year} ${make} ${model}`);
        return { mpgCity: null, mpgHighway: null };
      }

      // Step 2: Select best matching option (if multiple)
      const selectedOption = this.selectBestOption(options, engine);
      logger.info(`EPA: Selected option ID ${selectedOption.value}: ${selectedOption.text}`);

      // Step 3: Get vehicle details with MPG data
      const vehicleData = await this.getVehicleDetails(selectedOption.value);

      if (!vehicleData) {
        logger.warn(`EPA: No vehicle data found for ID ${selectedOption.value}`);
        return { mpgCity: null, mpgHighway: null };
      }

      // Extract MPG values
      const mpgCity = vehicleData.city08 ? parseInt(vehicleData.city08) : null;
      const mpgHighway = vehicleData.highway08 ? parseInt(vehicleData.highway08) : null;

      logger.info(`EPA: Found MPG for ${year} ${make} ${model} - City: ${mpgCity}, Highway: ${mpgHighway}`);

      return { mpgCity, mpgHighway };

    } catch (error) {
      logger.error(`EPA: Error getting MPG for ${year} ${make} ${model}:`, error.message);
      // Return null values on error (graceful degradation)
      return { mpgCity: null, mpgHighway: null };
    }
  }

  /**
   * Get vehicle options for a specific year/make/model
   * @param {string} year - Model year
   * @param {string} make - Manufacturer
   * @param {string} model - Model name
   * @returns {Promise<Array>} Array of options with vehicle IDs
   */
  async getVehicleOptions(year, make, model) {
    const url = `${this.baseURL}/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`EPA API returned ${response.status}: ${response.statusText}`);
      }

      const xmlData = await response.text();
      const result = await this.parser.parseStringPromise(xmlData);

      // Parse menu items
      if (!result.menuItems || !result.menuItems.menuItem) {
        return [];
      }

      // Handle single item (not an array) or array of items
      const items = Array.isArray(result.menuItems.menuItem)
        ? result.menuItems.menuItem
        : [result.menuItems.menuItem];

      return items.map(item => ({
        text: item.text,
        value: item.value
      }));

    } catch (error) {
      logger.error(`EPA: Error fetching options for ${year} ${make} ${model}:`, error.message);
      throw error;
    }
  }

  /**
   * Get detailed vehicle data including MPG
   * @param {string} vehicleId - EPA vehicle ID
   * @returns {Promise<Object>} Vehicle data with MPG values
   */
  async getVehicleDetails(vehicleId) {
    const url = `${this.baseURL}/vehicle/${vehicleId}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`EPA API returned ${response.status}: ${response.statusText}`);
      }

      const xmlData = await response.text();
      const result = await this.parser.parseStringPromise(xmlData);

      return result.vehicle || null;

    } catch (error) {
      logger.error(`EPA: Error fetching vehicle details for ID ${vehicleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Select the best matching option from multiple choices
   * Uses engine description to match if available, otherwise returns first option
   * @param {Array} options - Array of vehicle options
   * @param {string} engine - Engine description from NHTSA (optional)
   * @returns {Object} Selected option
   */
  selectBestOption(options, engine) {
    if (options.length === 1) {
      return options[0];
    }

    // If we have engine info, try to match by displacement
    if (engine) {
      // Extract displacement from engine string (e.g., "3.0L" from "3.0L 6-Cylinder")
      const engineMatch = engine.match(/(\d+\.\d+)L/);
      if (engineMatch) {
        const displacement = engineMatch[1];

        // Try to find option with matching displacement
        const match = options.find(opt => opt.text.includes(`${displacement} L`));
        if (match) {
          logger.info(`EPA: Matched option by engine displacement: ${displacement}L`);
          return match;
        }
      }
    }

    // Default to first option
    logger.info('EPA: Using first option (no engine match)');
    return options[0];
  }
}

// Export singleton instance
module.exports = new EPAFuelEconomyService();
