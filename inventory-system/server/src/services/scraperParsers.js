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

    // Debug: Log what classes exist in the HTML
    const allDivs = $('div[class*="dws"]');
    const uniqueClasses = new Set();
    allDivs.each((i, el) => {
      const classes = $(el).attr('class');
      if (classes) {
        classes.split(' ').forEach(cls => {
          if (cls.includes('dws')) uniqueClasses.add(cls);
        });
      }
    });
    logger.info(`DWS classes in HTML: ${Array.from(uniqueClasses).slice(0, 20).join(', ')}`);

    // Find all vehicle listing items (use specific selector to avoid duplicates)
    // The element has BOTH classes, so just use the more specific one
    let elements = $('.dws-vehicle-listing-item-info.dws-listing-item');

    logger.info(`Elements found - .dws-vehicle-listing-item-info: ${$('.dws-vehicle-listing-item-info').length}, .dws-listing-item: ${$('.dws-listing-item').length}`);

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

        // Extract VIN (use .first() to avoid duplicate desktop/mobile versions)
        let vin = null;

        // Method 1: data-vin attribute
        vin = $elem.find('[data-vin]').first().attr('data-vin');

        // Method 2: VIN field value (use .first() to get only desktop version)
        if (!vin) {
          vin = $elem.find('.dws-vehicle-field-vin .dws-vehicle-listing-item-field-value').first().text().trim();
        }

        // Method 3: Look for text that looks like a VIN (17 alphanumeric characters)
        if (!vin) {
          const allText = $elem.text();
          const vinMatch = allText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
          if (vinMatch) vin = vinMatch[1];
        }

        // Extract stock number (use .first() to avoid duplicate desktop/mobile versions)
        let stock_number = $elem.find('.dws-vehicle-field-stock-number .dws-vehicle-listing-item-field-value').first().text().trim();

        // Fallback 1: Look for common stock number patterns
        if (!stock_number) {
          stock_number = $elem.find('[class*="stock"] .dws-vehicle-listing-item-field-value').first().text().trim();
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

        // Extract title from parent container (it's outside the info element)
        const $titleContainer = $elem.closest('.list-group, .col-md-4, [class*="container"]').first();
        let title = $titleContainer.find('.dws-listing-title a').first().text().trim();

        // Fallback: try other common title selectors
        if (!title) {
          title = $titleContainer.find('.dws-listing-title, .dws-vehicle-title, h2, h3, h4, .title, [class*="title"]').first().text().trim();
        }

        // Updated regex to handle hyphens in make names (e.g., MERCEDES-BENZ)
        const titleMatch = title.match(/(\d{4})\s+([A-Za-z-]+)\s+([A-Za-z0-9\s-]+)/);

        const year = titleMatch ? parseInt(titleMatch[1]) : null;
        const make = titleMatch ? titleMatch[2] : null;
        const model = titleMatch ? titleMatch[3].trim() : null;

        // Extract trim
        const trim = $elem.find('.dws-vehicle-field-trim .dws-vehicle-listing-item-field-value, .dws-listing-specs-item.dws-vehicle-field-trim .dws-vehicle-listing-item-field-value').text().trim();

        // Extract mileage (use .first() to avoid duplicate desktop/mobile versions)
        let mileageText = $elem.find('.dws-vehicle-field-mileage .dws-vehicle-listing-item-field-value').first().text().trim();

        // Fallback: look for text containing "mi" or "miles"
        if (!mileageText) {
          const allText = $elem.text();
          const mileageMatch = allText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:mi|miles)/i);
          if (mileageMatch) mileageText = mileageMatch[1];
        }

        const mileage = mileageText ? parseInt(mileageText.replace(/,/g, '')) : null;

        // Extract price - it's in a parent container, not in the current element
        // Go up to find the full vehicle card
        const $vehicleCard = $elem.closest('.list-group, .col-md-4, [class*="container"]').first();

        let priceText = null;

        // Method 1: Specific Dealer Center price class
        priceText = $vehicleCard.find('.dws-vehicle-price-value').first().text().trim();

        if (!priceText) {
          // Method 2: data-sales-price attribute
          priceText = $vehicleCard.find('[data-sales-price]').first().attr('data-sales-price');
        }

        if (!priceText) {
          // Method 3: Common price selectors
          priceText = $vehicleCard.find('.dws-listing-price, .price, [class*="price"]:not([class*="icon"])').first().text().trim();
        }

        if (!priceText) {
          // Method 4: Regex fallback - find $XXX,XXX pattern
          const allText = $vehicleCard.text();
          const priceMatch = allText.match(/\$(\d{1,3}(?:,\d{3})+)/);
          if (priceMatch) priceText = priceMatch[0]; // Keep the $ sign for parsing
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
   * Returns: array of vehicles parsed from all pages
   */
  loadAll: async (page) => {
    const cheerio = require('cheerio');
    const allVehicles = [];
    let attempts = 0;
    const MAX_ATTEMPTS = 50;
    let pageNumber = 1;

    logger.info(`Starting Dealer Center pagination loading...`);

    while (attempts < MAX_ATTEMPTS) {
      // Parse vehicles from current page
      const html = await page.content();
      const $ = cheerio.load(html);
      const vehiclesOnPage = dealercenter.parse($);

      logger.info(`Page ${pageNumber}: Parsed ${vehiclesOnPage.length} vehicles`);

      // Add vehicles from this page to collection
      allVehicles.push(...vehiclesOnPage);

      // Look for "Load More" or pagination
      const loadMoreBtn = await page.$(
        'button.load-more, a.load-more, ' +
        'button:has-text("Load More"), a:has-text("Load More"), ' +
        '.pagination a.next, .pagination-next'
      );

      if (!loadMoreBtn) {
        // Look for "Next" page button (chevron/arrow) - more reliable than generic page_no links
        let nextPageLink = await page.$('a.page-link-chevron[aria-label*="Next"], a[aria-label*="Next page"]');

        // Fallback: Find the next page number link (current page + 1)
        if (!nextPageLink) {
          const nextPageNum = pageNumber + 1;
          nextPageLink = await page.$(`a[href*="page_no=${nextPageNum}"]`);
          if (nextPageLink) {
            logger.info(`Found next page link for page ${nextPageNum}`);
          }
        }

        if (nextPageLink) {
          try {
            // Get the href and navigate directly instead of clicking
            const nextUrl = await nextPageLink.getAttribute('href');
            if (nextUrl) {
              // If it's a relative URL, construct the full URL
              const fullUrl = nextUrl.startsWith('http')
                ? nextUrl
                : new URL(nextUrl, page.url()).href;

              pageNumber++;
              logger.info(`Navigating to page ${pageNumber}: ${fullUrl}`);

              // Use domcontentloaded instead of networkidle (more reliable)
              await page.goto(fullUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 45000
              });

              // Wait for vehicle elements to appear
              try {
                await page.waitForSelector('.dws-vehicle-listing-item, .dws-listing-item', {
                  timeout: 10000
                });
              } catch (e) {
                logger.warn(`Timeout waiting for vehicle elements on page ${pageNumber}`);
              }

              await page.waitForTimeout(2000);
              attempts++;
              continue;
            }
          } catch (error) {
            logger.warn(`Failed to navigate to page ${pageNumber}: ${error.message}`);
            break;
          }
        }

        logger.info(`No more pagination controls found. Stopping at page ${pageNumber}.`);
        break;
      }

      // Found Load More button - click it
      logger.info(`Clicking "Load More" button...`);
      await loadMoreBtn.click();
      await page.waitForTimeout(3000);
      attempts++;
      pageNumber++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      logger.warn(`Reached maximum pagination attempts (${MAX_ATTEMPTS}). Stopping.`);
    }

    // Deduplicate vehicles by VIN or stock number
    const uniqueVehicles = [];
    const seen = new Set();

    for (const vehicle of allVehicles) {
      const identifier = vehicle.vin || vehicle.stock_number;
      if (identifier && !seen.has(identifier)) {
        seen.add(identifier);
        uniqueVehicles.push(vehicle);
      }
    }

    if (uniqueVehicles.length < allVehicles.length) {
      logger.warn(`Removed ${allVehicles.length - uniqueVehicles.length} duplicate vehicles`);
    }

    logger.info(`Dealer Center pagination complete: ${uniqueVehicles.length} unique vehicles collected across ${pageNumber} page(s)`);
    return uniqueVehicles;
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
        // Updated regex to handle hyphens in make names (e.g., MERCEDES-BENZ)
        const titleMatch = title.match(/(\d{4})\s+([A-Za-z-]+)\s+([A-Za-z0-9\s-]+)/);

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
   * Load all vehicles (handle "Load More" button and infinite scroll)
   */
  loadAll: async (page) => {
    const cheerio = require('cheerio');
    const allVehicles = [];
    let previousCount = 0;
    let stagnantAttempts = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;
    const MAX_STAGNANT = 3; // Stop after 3 consecutive attempts with no new vehicles

    logger.info('Starting Dealersync loading (Load More + Infinite Scroll)...');

    while (attempts < MAX_ATTEMPTS && stagnantAttempts < MAX_STAGNANT) {
      // Count current vehicles on page
      const currentCount = await page.$$eval('.ds-vehicle-list-item, .ds-car-griditem', els => els.length);
      logger.info(`Attempt ${attempts + 1}: Found ${currentCount} vehicle elements (previous: ${previousCount})`);

      // Check if we got new vehicles
      if (currentCount === previousCount) {
        stagnantAttempts++;
        logger.info(`No new vehicles loaded (stagnant: ${stagnantAttempts}/${MAX_STAGNANT})`);

        // If stagnant, we're done
        if (stagnantAttempts >= MAX_STAGNANT) {
          logger.info('No new vehicles after multiple attempts. Stopping.');
          break;
        }
      } else {
        stagnantAttempts = 0; // Reset stagnant counter
        previousCount = currentCount;
      }

      // Try method 1: Look for "Load More" button
      const loadMoreBtn = await page.$(
        'button.load-more, a.load-more, ' +
        'button:has-text("Load More"), a:has-text("Load More"), ' +
        '.ds-load-more, .load-more-btn'
      );

      if (loadMoreBtn) {
        logger.info('Found "Load More" button, clicking...');
        await loadMoreBtn.click();
        await page.waitForTimeout(3000); // Wait for content to load
        attempts++;
        continue;
      }

      // Method 2: Infinite scroll - scroll to bottom
      logger.info('No "Load More" button found, trying infinite scroll...');

      // Get current scroll position
      const previousHeight = await page.evaluate(() => document.body.scrollHeight);

      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for potential network requests and new content
      await page.waitForTimeout(2000);

      // Check if page height increased (new content loaded)
      const newHeight = await page.evaluate(() => document.body.scrollHeight);

      if (newHeight > previousHeight) {
        logger.info(`Page height increased (${previousHeight} -> ${newHeight}), content may have loaded`);
      } else {
        logger.info('Page height unchanged, no new content detected');
      }

      attempts++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      logger.warn(`Reached maximum attempts (${MAX_ATTEMPTS}). Stopping.`);
    }

    // Parse all vehicles from final page content
    const html = await page.content();
    const $ = cheerio.load(html);
    const vehicles = dealersync.parse($);

    logger.info(`Dealersync loading complete: ${vehicles.length} unique vehicles collected`);
    return vehicles;
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
            // Updated regex to handle hyphens in make/model names (e.g., MERCEDES-BENZ)
            const titleMatch = title.match(/(\d{4})\s+([A-Za-z-]+)\s+([A-Za-z0-9\s-]+)/);

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
