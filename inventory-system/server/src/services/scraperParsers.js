/**
 * Platform-Specific Parsers for Competitor Scraping
 *
 * Each platform (Dealer Center, Dealersync, etc.) has custom HTML structure
 * This file contains parsers and loaders for each platform
 */

const logger = require('../config/logger');

/**
 * DEALER CENTER PARSER
 * Used by: Bucket Buddy Auto, Sacramento Best Car
 * HTML Classes: dws-*
 */
const dealercenter = {
  /**
   * Parse vehicles from Dealer Center HTML
   */
  parse: ($) => {
    const vehicles = [];

    // Find all vehicle listing items
    $('.dws-vehicle-listing-item, .dws-listing-item, [class*="dws-listing"]').each((i, elem) => {
      try {
        const $elem = $(elem);

        // Extract VIN (multiple possible locations)
        let vin = null;

        // Method 1: data-vin attribute
        vin = $elem.find('[data-vin]').attr('data-vin');

        // Method 2: VIN field value
        if (!vin) {
          vin = $elem.find('.dws-vehicle-field-vin .dws-vehicle-listing-item-field-value').text().trim();
        }

        // Method 3: Capital One button data-vin
        if (!vin) {
          vin = $elem.find('[data-vin]').first().attr('data-vin');
        }

        // Extract stock number
        let stock_number = $elem.find('.dws-vehicle-field-stock-number .dws-vehicle-listing-item-field-value').text().trim();

        // Fallback: extract from URL
        if (!stock_number) {
          const href = $elem.find('a[href*="/inventory/"]').attr('href');
          if (href) {
            const match = href.match(/\/inventory\/[^/]+\/[^/]+\/([^/]+)/);
            if (match) stock_number = match[1];
          }
        }

        // Extract vehicle details
        const title = $elem.find('.dws-listing-title, .dws-vehicle-title').text().trim();
        const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9\s]+)/);

        const year = titleMatch ? parseInt(titleMatch[1]) : null;
        const make = titleMatch ? titleMatch[2] : null;
        const model = titleMatch ? titleMatch[3].split('-')[0].trim() : null;

        // Extract trim
        const trim = $elem.find('.dws-vehicle-field-trim .dws-vehicle-listing-item-field-value, .dws-listing-specs-item.dws-vehicle-field-trim .dws-vehicle-listing-item-field-value').text().trim();

        // Extract mileage
        const mileageText = $elem.find('.dws-vehicle-field-mileage .dws-vehicle-listing-item-field-value, .dws-listing-specs-item.dws-vehicle-field-mileage .dws-vehicle-listing-item-field-value').text().trim();
        const mileage = mileageText ? parseInt(mileageText.replace(/,/g, '')) : null;

        // Extract price
        let priceText = $elem.find('[data-sales-price]').attr('data-sales-price');
        if (!priceText) {
          priceText = $elem.find('.dws-listing-price, .price, [class*="price"]').text().trim();
        }
        const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '')) : null;

        // Extract color
        const exterior_color = $elem.find('.dws-vehicle-field-exterior-color .dws-vehicle-listing-item-field-value').text().trim();

        // Only add if we have at least an identifier and price
        if ((vin || stock_number) && price) {
          vehicles.push({
            vin: vin || null,
            stock_number: stock_number || null,
            year,
            make,
            model,
            trim: trim || null,
            mileage,
            price,
            exterior_color: exterior_color || null
          });
        }
      } catch (error) {
        logger.warn(`Error parsing Dealer Center vehicle:`, error);
      }
    });

    logger.info(`Dealer Center parser found ${vehicles.length} vehicles`);
    return vehicles;
  },

  /**
   * Load all vehicles (handle pagination)
   */
  loadAll: async (page) => {
    let previousCount = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    while (attempts < MAX_ATTEMPTS) {
      const currentCount = await page.$$eval('.dws-vehicle-listing-item, .dws-listing-item', els => els.length);

      if (currentCount === previousCount) break;
      previousCount = currentCount;

      // Look for "Load More" or pagination
      const loadMoreBtn = await page.$(
        'button.load-more, a.load-more, ' +
        'button:has-text("Load More"), a:has-text("Load More"), ' +
        '.pagination a.next, .pagination-next'
      );

      if (!loadMoreBtn) {
        // Check if there's a next page link
        const nextPage = await page.$('a[href*="page_no="]');
        if (nextPage) {
          await nextPage.click();
          await page.waitForTimeout(3000);
          attempts++;
          continue;
        }
        break;
      }

      await loadMoreBtn.click();
      await page.waitForTimeout(2000);
      attempts++;
    }

    logger.info(`Dealer Center loaded ${previousCount} vehicle elements`);
    return previousCount;
  }
};

/**
 * DEALERSYNC PARSER
 * Used by: M&S Auto Group
 * HTML Classes: ds-*
 */
const dealersync = {
  /**
   * Parse vehicles from Dealersync HTML
   */
  parse: ($) => {
    const vehicles = [];

    // Find all vehicle items
    $('.ds-vehicle-list-item, .ds-car-griditem').each((i, elem) => {
      try {
        const $elem = $(elem);

        // Extract VIN from data attribute
        const vin = $elem.attr('data-vin');
        const stock_number = $elem.attr('data-stock-no');

        // Extract vehicle title
        const title = $elem.find('.ds-listview-vehicle-title, .ds-vehicle-title').text().trim();
        const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9\s]+)/);

        const year = titleMatch ? parseInt(titleMatch[1]) : null;
        const make = titleMatch ? titleMatch[2] : null;
        const model = titleMatch ? titleMatch[3].split('w/')[0].trim() : null;

        // Extract trim (from subtitle or title)
        let trim = $elem.find('h5, .ds-listview-subtitle').text().trim();
        if (!trim && title.includes('w/')) {
          trim = 'w/' + title.split('w/')[1];
        }

        // Extract mileage
        const mileageText = $elem.find('.ds-listview-item-featured-content-tag, [class*="mileage"]').text().trim();
        const mileage = mileageText ? parseInt(mileageText.replace(/,/g, '')) : null;

        // Extract price
        const priceText = $elem.find('.ds-listview-price-value, .ds-price').text().trim();
        const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '')) : null;

        // Only add if we have VIN or stock number and price
        if ((vin || stock_number) && price) {
          vehicles.push({
            vin: vin || null,
            stock_number: stock_number || null,
            year,
            make,
            model,
            trim: trim || null,
            mileage,
            price,
            exterior_color: null
          });
        }
      } catch (error) {
        logger.warn(`Error parsing Dealersync vehicle:`, error);
      }
    });

    logger.info(`Dealersync parser found ${vehicles.length} vehicles`);
    return vehicles;
  },

  /**
   * Load all vehicles (handle "Load More" button)
   */
  loadAll: async (page) => {
    let previousCount = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    while (attempts < MAX_ATTEMPTS) {
      const currentCount = await page.$$eval('.ds-vehicle-list-item, .ds-car-griditem', els => els.length);

      if (currentCount === previousCount) break;
      previousCount = currentCount;

      // Dealersync uses "Load More" button or infinite scroll
      const loadMoreBtn = await page.$(
        'button.load-more, a.load-more, ' +
        'button:has-text("Load More"), a:has-text("Load More"), ' +
        '.ds-load-more'
      );

      if (!loadMoreBtn) break;

      await loadMoreBtn.click();
      await page.waitForTimeout(2000);
      attempts++;
    }

    logger.info(`Dealersync loaded ${previousCount} vehicle elements`);
    return previousCount;
  }
};

/**
 * CUSTOM/GENERIC PARSER
 * Fallback for unknown platforms
 */
const custom = {
  parse: ($) => {
    const vehicles = [];

    // Try generic selectors
    const selectors = [
      '.vehicle-item',
      '.car-item',
      '.listing-item',
      '.inventory-item',
      '[class*="vehicle"]',
      '[class*="inventory"]'
    ];

    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        logger.info(`Custom parser found ${items.length} items with selector: ${selector}`);

        items.each((i, elem) => {
          try {
            const $elem = $(elem);

            // Try to extract VIN
            const vin = $elem.find('[data-vin]').attr('data-vin') ||
                       $elem.find('[class*="vin"]').text().trim();

            // Try to extract stock number
            const stock_number = $elem.find('[class*="stock"]').text().trim();

            // Try to extract price
            const priceText = $elem.find('[class*="price"]').text().trim();
            const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '')) : null;

            // Try to extract year/make/model
            const title = $elem.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
            const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9\s]+)/);

            if ((vin || stock_number) && price && titleMatch) {
              vehicles.push({
                vin: vin || null,
                stock_number: stock_number || null,
                year: parseInt(titleMatch[1]),
                make: titleMatch[2],
                model: titleMatch[3],
                trim: null,
                mileage: null,
                price,
                exterior_color: null
              });
            }
          } catch (error) {
            logger.warn(`Error parsing custom vehicle:`, error);
          }
        });

        if (vehicles.length > 0) break;
      }
    }

    logger.info(`Custom parser found ${vehicles.length} vehicles`);
    return vehicles;
  },

  loadAll: async (page) => {
    // Generic load more handler
    let previousCount = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    while (attempts < MAX_ATTEMPTS) {
      const currentCount = await page.$$eval('[class*="vehicle"], [class*="listing"], [class*="car"], [class*="inventory"]', els => els.length);

      if (currentCount === previousCount) break;
      previousCount = currentCount;

      const loadMoreBtn = await page.$('button:has-text("Load More"), a:has-text("Load More"), button.load-more');
      if (!loadMoreBtn) break;

      await loadMoreBtn.click();
      await page.waitForTimeout(2000);
      attempts++;
    }

    return previousCount;
  }
};

module.exports = {
  dealercenter,
  dealersync,
  custom
};
