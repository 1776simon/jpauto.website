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

    // Find all vehicle listing items (be specific to avoid UI controls)
    // Look for top-level vehicle containers, not nested elements
    let elements = $(
      '.dws-vehicle-listing-item:not(.dws-listing-item-info):not(.dws-listing-item-field), ' +
      '.vehicle-listing-item, ' +
      '.vehicle-card, ' +
      '[class*="vehicle-item"]:not([class*="field"])'
    );

    // Fallback: If no elements found, try finding containers with vehicle detail links
    if (elements.length === 0) {
      logger.info('No elements found with standard selectors, trying link-based approach...');

      // Find all links to vehicle detail pages
      const vehicleLinks = $('a[href*="/inventory/view/"], a[href*="/view/"], a[href*="/details/"]');
      logger.info(`Found ${vehicleLinks.length} vehicle detail links`);

      // Get the closest parent container for each link (likely the vehicle card)
      const containers = new Set();
      vehicleLinks.each((i, link) => {
        const $link = $(link);
        // Try to find the vehicle card container (common classes)
        const $container = $link.closest('.row, .col, [class*="vehicle"], [class*="item"], [class*="card"]');
        if ($container.length > 0) {
          containers.add($container[0]);
        }
      });

      elements = $(Array.from(containers));
      logger.info(`Found ${elements.length} unique vehicle containers via links`);
    }

    logger.info(`Found ${elements.length} vehicle elements in HTML`);

    elements.each((i, elem) => {
      try {
        const $elem = $(elem);

        // Debug: Log full HTML of first element to understand structure
        if (i === 0) {
          logger.info(`First element HTML sample: ${$elem.html().substring(0, 500)}...`);
          logger.info(`First element classes: ${$elem.attr('class')}`);
        }

        // Extract VIN (multiple possible locations)
        let vin = null;

        // Method 1: data-vin attribute
        vin = $elem.find('[data-vin]').attr('data-vin');

        // Method 2: VIN field value
        if (!vin) {
          vin = $elem.find('.dws-vehicle-field-vin .dws-vehicle-listing-item-field-value').text().trim();
        }

        // Method 3: Look for text that looks like a VIN (17 alphanumeric characters)
        if (!vin) {
          const allText = $elem.text();
          const vinMatch = allText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
          if (vinMatch) vin = vinMatch[1];
        }

        // Extract stock number
        let stock_number = $elem.find('.dws-vehicle-field-stock-number .dws-vehicle-listing-item-field-value').text().trim();

        // Fallback 1: Look for common stock number patterns
        if (!stock_number) {
          stock_number = $elem.find('[class*="stock"], .stock-number, [data-stock]').first().text().trim();
        }

        // Fallback 2: Extract from URL
        if (!stock_number) {
          const href = $elem.find('a[href*="/inventory/"]').attr('href');
          if (href) {
            const match = href.match(/\/inventory\/[^/]+\/[^/]+\/([^/?]+)/);
            if (match) stock_number = match[1];
          }
        }

        // Fallback 3: Look for text that says "Stock#" or "Stock:"
        if (!stock_number) {
          const allText = $elem.text();
          const stockMatch = allText.match(/(?:Stock|Stk)[\s#:]*([A-Z0-9-]+)/i);
          if (stockMatch) stock_number = stockMatch[1];
        }

        // Extract vehicle details with flexible selectors
        let title = $elem.find('.dws-listing-title, .dws-vehicle-title').text().trim();

        // Fallback: try other common title selectors
        if (!title) {
          title = $elem.find('h2, h3, h4, .title, [class*="title"], [class*="name"]').first().text().trim();
        }

        const titleMatch = title.match(/(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9\s]+)/);

        const year = titleMatch ? parseInt(titleMatch[1]) : null;
        const make = titleMatch ? titleMatch[2] : null;
        const model = titleMatch ? titleMatch[3].split('-')[0].trim() : null;

        // Extract trim
        const trim = $elem.find('.dws-vehicle-field-trim .dws-vehicle-listing-item-field-value, .dws-listing-specs-item.dws-vehicle-field-trim .dws-vehicle-listing-item-field-value').text().trim();

        // Extract mileage with flexible selectors
        let mileageText = $elem.find('.dws-vehicle-field-mileage .dws-vehicle-listing-item-field-value, .dws-listing-specs-item.dws-vehicle-field-mileage .dws-vehicle-listing-item-field-value').text().trim();

        // Fallback: look for text containing "mi" or "miles"
        if (!mileageText) {
          const allText = $elem.text();
          const mileageMatch = allText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:mi|miles)/i);
          if (mileageMatch) mileageText = mileageMatch[1];
        }

        const mileage = mileageText ? parseInt(mileageText.replace(/,/g, '')) : null;

        // Extract price with multiple fallbacks
        // First, try to find the full vehicle card container (go up to parent)
        const $vehicleCard = $elem.closest('[class*="vehicle"]:not([class*="field"]):not([class*="icon"])') || $elem;

        let priceText = $vehicleCard.find('[data-sales-price]').attr('data-sales-price');

        if (!priceText) {
          // Try common price selectors in the full card
          priceText = $vehicleCard.find('.dws-listing-price, .price, [class*="price"]:not([class*="icon"]), .amount, [class*="amount"]').first().text().trim();
        }

        if (!priceText) {
          // Try in current element as fallback
          priceText = $elem.find('.dws-listing-price, .price, [class*="price"]:not([class*="icon"]), .amount, [class*="amount"]').first().text().trim();
        }

        if (!priceText) {
          // Fallback: look for text that looks like a price ($X,XXX) in the full card
          const allText = $vehicleCard.text();
          const priceMatch = allText.match(/\$(\d{1,3}(?:,\d{3})+)/);
          if (priceMatch) priceText = priceMatch[1];
        }

        const price = priceText ? parseFloat(priceText.replace(/[$,]/g, '')) : null;

        // Extract color
        const exterior_color = $elem.find('.dws-vehicle-field-exterior-color .dws-vehicle-listing-item-field-value').text().trim();

        // Debug logging for first few vehicles
        if (i < 3) {
          logger.info(`Vehicle ${i}: VIN=${vin}, Stock=${stock_number}, Price=${price}, PriceText="${priceText}", Title=${title}`);
        }

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
        } else {
          if (i < 3) {
            logger.warn(`Skipping vehicle ${i}: Missing required data (VIN/Stock: ${vin || stock_number}, Price: ${price})`);
          }
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
        // Check if there's a next page link with page_no parameter
        const nextPageLink = await page.$('a[href*="page_no="]');
        if (nextPageLink) {
          try {
            // Get the href and navigate directly instead of clicking
            const nextUrl = await nextPageLink.getAttribute('href');
            if (nextUrl) {
              // If it's a relative URL, construct the full URL
              const fullUrl = nextUrl.startsWith('http')
                ? nextUrl
                : new URL(nextUrl, page.url()).href;

              logger.info(`Navigating to next page: ${fullUrl}`);
              await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
              await page.waitForTimeout(2000);
              attempts++;
              continue;
            }
          } catch (error) {
            logger.warn(`Failed to navigate to next page: ${error.message}`);
            break;
          }
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
