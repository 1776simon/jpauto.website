/**
 * Auto.dev Market Research Service
 *
 * Integrates with Auto.dev Listings API for competitive market analysis
 * Handles: API calls, mileage range calculation, deduplication, platform parsing
 */

const fetch = require('node-fetch');
const logger = require('../config/logger');

class AutoDevMarketResearchService {
  constructor() {
    this.apiKey = process.env.AUTODEV_API_KEY;
    this.apiUrl = process.env.AUTODEV_API_URL || 'https://api.auto.dev';
    this.defaultZip = process.env.MARKET_RESEARCH_ZIP_CODE || '95814'; // Sacramento
    this.defaultRadius = parseInt(process.env.MARKET_RESEARCH_RADIUS) || 150;

    if (!this.apiKey) {
      logger.warn('AUTODEV_API_KEY not configured - market research will be disabled');
    }
  }

  /**
   * Fetch market listings for a vehicle
   */
  async fetchListings(vehicle, options = {}) {
    if (!this.apiKey) {
      throw new Error('Auto.dev API key not configured');
    }

    const { expansion = 0, yearRange = null } = options;
    const params = this.buildSearchParams(vehicle, expansion, yearRange);

    const url = `${this.apiUrl}/listings?${new URLSearchParams(params).toString()}`;

    logger.info('Fetching market listings', {
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      params,
      url // Log the full URL for debugging
    });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auto.dev API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      logger.info('Market listings fetched successfully', {
        total: data.data?.length || 0,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      });

      return {
        listings: data.data || [],
        pagination: data.pagination || {},
        totalResults: data.data?.length || 0
      };
    } catch (error) {
      logger.error('Failed to fetch market listings', {
        error: error.message,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      });
      throw error;
    }
  }

  /**
   * Build search parameters for Auto.dev API
   */
  buildSearchParams(vehicle, expansion = 0, yearRange = null) {
    const params = {
      'vehicle.make': vehicle.make,
      'vehicle.model': vehicle.model,
      'zip': this.defaultZip,           // User confirmed: zip (not retailListing.zipCode)
      'distance': this.defaultRadius,   // User confirmed: distance (not radius)
      'limit': 100,
      'page': 1
    };

    // Year filtering
    if (yearRange && yearRange !== 'exact') {
      // yearRange format: "±1", "±2", "±3"
      const range = parseInt(yearRange.replace('±', ''));
      const minYear = vehicle.year - range;
      const maxYear = vehicle.year + range;
      params['vehicle.year'] = `${minYear}-${maxYear}`;
    } else {
      // Exact year (default for scheduled analysis)
      params['vehicle.year'] = vehicle.year;
    }

    // Mileage range with optional expansion
    const mileageRange = this.calculateMileageRange(vehicle.mileage, expansion);
    params['retailListing.mileage'] = `${mileageRange.min}-${mileageRange.max}`;

    return params;
  }

  /**
   * Calculate mileage search range based on vehicle's mileage
   *
   * Brackets (user specified):
   * - 0-50k miles: ±10k
   * - 50-100k miles: ±20k
   * - 100k+ miles: ±30k
   *
   * Min floor: 500 miles (used vehicles only)
   * Auto-expansion: +10k if <10 results (max +50k total)
   */
  calculateMileageRange(mileage, expansion = 0) {
    let spread;

    if (mileage <= 50000) {
      spread = 10000 + expansion;
    } else if (mileage <= 100000) {
      spread = 20000 + expansion;
    } else {
      spread = 30000 + expansion;
    }

    const min = Math.max(500, mileage - spread); // Never below 500 miles
    const max = mileage + spread;

    return { min, max, spread };
  }

  /**
   * Deduplicate listings by VIN
   * Priority: Lowest price → Most recent
   */
  deduplicateListings(listings) {
    const vinMap = new Map();
    const duplicates = [];

    listings.forEach(listing => {
      const vin = listing.vehicle?.vin;

      if (!vin) {
        // No VIN, keep the listing
        return;
      }

      if (vinMap.has(vin)) {
        duplicates.push(listing);

        const existing = vinMap.get(vin);
        const existingPrice = existing.retailListing?.price || Infinity;
        const currentPrice = listing.retailListing?.price || Infinity;

        // Keep lower price, or if equal, keep more recent
        if (currentPrice < existingPrice) {
          vinMap.set(vin, listing);
        } else if (currentPrice === existingPrice) {
          const existingDate = new Date(existing.retailListing?.listedDate || 0);
          const currentDate = new Date(listing.retailListing?.listedDate || 0);

          if (currentDate > existingDate) {
            vinMap.set(vin, listing);
          }
        }
      } else {
        vinMap.set(vin, listing);
      }
    });

    const uniqueListings = Array.from(vinMap.values());

    logger.info('Deduplication complete', {
      original: listings.length,
      unique: uniqueListings.length,
      duplicates: duplicates.length,
      duplicateRate: ((duplicates.length / listings.length) * 100).toFixed(1) + '%'
    });

    return { uniqueListings, duplicates };
  }

  /**
   * Exclude own inventory from market listings
   */
  excludeOwnInventory(listings, ownVins) {
    const ownVinsSet = new Set(ownVins.map(v => v.toUpperCase()));

    const filtered = listings.filter(listing => {
      const vin = listing.vehicle?.vin?.toUpperCase();
      return !vin || !ownVinsSet.has(vin);
    });

    const excluded = listings.length - filtered.length;

    if (excluded > 0) {
      logger.info('Excluded own inventory from market listings', {
        excluded,
        remaining: filtered.length
      });
    }

    return filtered;
  }

  /**
   * Calculate price statistics from listings
   */
  calculatePriceStats(listings) {
    const prices = listings
      .map(l => l.retailListing?.price)
      .filter(p => p && p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return {
        median: null,
        average: null,
        min: null,
        max: null,
        count: 0
      };
    }

    const median = prices[Math.floor(prices.length / 2)];
    const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const min = prices[0];
    const max = prices[prices.length - 1];

    return {
      median: parseFloat(median.toFixed(2)),
      average: parseFloat(average.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      count: prices.length
    };
  }

  /**
   * Parse platform name from VDP URL
   * User specified: carsforsale.com is SEPARATE from cars.com
   */
  parsePlatform(vdpUrl) {
    if (!vdpUrl) return null;

    try {
      const url = new URL(vdpUrl);
      const domain = url.hostname.replace('www.', '');

      const platformMap = {
        'carsforsale.com': 'CarsForSale.com',  // User noted: separate from cars.com
        'cars.com': 'Cars.com',
        'autotrader.com': 'AutoTrader',
        'cargurus.com': 'CarGurus',
        'truecar.com': 'TrueCar',
        'edmunds.com': 'Edmunds',
        'carmax.com': 'CarMax',
        'carvana.com': 'Carvana',
        'vroom.com': 'Vroom',
        'facebook.com': 'Facebook Marketplace',
        'craigslist.org': 'Craigslist'
      };

      return platformMap[domain] || domain;
    } catch (error) {
      logger.warn('Failed to parse platform from URL', { url: vdpUrl, error: error.message });
      return null;
    }
  }

  /**
   * Extract platform data from listings
   */
  extractPlatformData(listings, ownVins = []) {
    const ownVinsSet = new Set(ownVins.map(v => v.toUpperCase()));
    const platformData = [];

    listings.forEach(listing => {
      const vin = listing.vehicle?.vin;
      const vdpUrl = listing.retailListing?.vdpUrl;

      if (!vin || !vdpUrl) return;

      const platform = this.parsePlatform(vdpUrl);
      if (!platform) return;

      const isOwnVehicle = ownVinsSet.has(vin.toUpperCase());

      platformData.push({
        vin,
        platform,
        isOwnVehicle,
        price: listing.retailListing?.price,
        dealerName: listing.retailListing?.dealerName,
        listingUrl: vdpUrl
      });
    });

    return platformData;
  }

  /**
   * Calculate percentile rank for our vehicle's price
   * Returns value 0-100 (0 = cheapest, 100 = most expensive)
   */
  calculatePercentileRank(ourPrice, marketPrices) {
    if (!marketPrices || marketPrices.length === 0) {
      return null;
    }

    const sortedPrices = [...marketPrices].sort((a, b) => a - b);
    const count = sortedPrices.length;

    // Count how many prices are below ours
    const belowCount = sortedPrices.filter(p => p < ourPrice).length;

    // Percentile rank
    const percentile = (belowCount / count) * 100;

    return parseFloat(percentile.toFixed(2));
  }

  /**
   * Determine competitive position
   */
  determineCompetitivePosition(priceDeltaPercent) {
    if (priceDeltaPercent === null) return null;

    if (priceDeltaPercent >= -10 && priceDeltaPercent <= 10) {
      return 'competitive';
    } else if (priceDeltaPercent > 10) {
      return 'above_market';
    } else {
      return 'below_market';
    }
  }
}

module.exports = new AutoDevMarketResearchService();
