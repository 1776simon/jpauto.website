/**
 * Market Alert Service
 *
 * Detects and manages market research alerts
 * 5 Alert Types (user specified):
 * 1. Price vs Median (>10% above/below)
 * 2. Cumulative Market Median Change (>5% over 1-week or 2-week)
 * 3. Inventory Surge/Decline (>20%)
 * 4. Competitor Pricing (>15% cheaper)
 * 5. Own Vehicle Detected on External Platform
 */

const marketDb = require('./marketDatabaseService');
const { sequelize } = require('../models');
const logger = require('../config/logger');

class MarketAlertService {
  /**
   * Detect all alerts for a vehicle analysis
   */
  async detectAlerts(vehicleId, analysisResult) {
    if (!analysisResult || !analysisResult.success) {
      return [];
    }

    const alerts = [];

    try {
      // Alert Type 1: Price vs Median (DISABLED per user request)
      // const priceAlert = await this.checkPriceVsMedian(vehicleId, analysisResult);
      // if (priceAlert) alerts.push(priceAlert);

      // Alert Type 2: Cumulative Market Median Change
      const medianChangeAlert = await this.checkCumulativeMedianChange(vehicleId);
      if (medianChangeAlert) alerts.push(medianChangeAlert);

      // Alert Type 3: Inventory Surge/Decline
      const inventoryAlert = await this.checkInventorySurge(vehicleId, analysisResult);
      if (inventoryAlert) alerts.push(inventoryAlert);

      // Alert Type 4: Competitor Pricing
      const competitorAlert = await this.checkCompetitorPricing(vehicleId, analysisResult);
      if (competitorAlert) alerts.push(competitorAlert);

      // Save all detected alerts
      for (const alert of alerts) {
        await marketDb.saveAlert(alert);
      }

      if (alerts.length > 0) {
        logger.info('Alerts detected', {
          vehicleId,
          count: alerts.length,
          types: alerts.map(a => a.alertType)
        });
      }

      return alerts;
    } catch (error) {
      logger.error('Alert detection failed', {
        vehicleId,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Alert Type 1: Price vs Median (>10% above or below)
   */
  async checkPriceVsMedian(vehicleId, analysisResult) {
    const { metrics, vehicle } = analysisResult;

    if (!metrics || !metrics.price_delta_percent) {
      return null;
    }

    const priceDeltaPercent = parseFloat(metrics.price_delta_percent);

    // Above market threshold
    if (priceDeltaPercent > 10) {
      return {
        vehicleId,
        snapshotId: analysisResult.snapshot?.id || null,
        alertType: 'price_above_market',
        severity: 'warning',
        title: `Price ${priceDeltaPercent.toFixed(1)}% Above Market`,
        message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is priced $${metrics.price_delta.toFixed(2)} (${priceDeltaPercent.toFixed(1)}%) above the market median of $${analysisResult.priceStats.median.toFixed(2)}.`,
        alertData: {
          ourPrice: vehicle.price,
          marketMedian: analysisResult.priceStats.median,
          priceDelta: metrics.price_delta,
          priceDeltaPercent
        }
      };
    }

    // Below market threshold (good price!)
    if (priceDeltaPercent < -10) {
      return {
        vehicleId,
        snapshotId: analysisResult.snapshot?.id || null,
        alertType: 'price_below_market',
        severity: 'info',
        title: `Price ${Math.abs(priceDeltaPercent).toFixed(1)}% Below Market`,
        message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is priced $${Math.abs(metrics.price_delta).toFixed(2)} (${Math.abs(priceDeltaPercent).toFixed(1)}%) below the market median. This is a competitive advantage.`,
        alertData: {
          ourPrice: vehicle.price,
          marketMedian: analysisResult.priceStats.median,
          priceDelta: metrics.price_delta,
          priceDeltaPercent
        }
      };
    }

    return null;
  }

  /**
   * Alert Type 2: Cumulative Market Median Change (>5% over 1-week or 2-week)
   * User specified: Alert on both 1-week AND 2-week thresholds, reset after sent
   */
  async checkCumulativeMedianChange(vehicleId) {
    try {
      const [latest] = await sequelize.query(`
        SELECT
          date,
          median_price,
          change_1week,
          change_2week,
          alert_sent_1week,
          alert_sent_2week
        FROM market_price_history
        WHERE vehicle_id = $1
        ORDER BY date DESC
        LIMIT 1
      `, {
        bind: [vehicleId]
      });

      if (!latest || latest.length === 0) {
        return null;
      }

      const record = latest[0];

      // Check 1-week change (5% threshold)
      if (record.change_1week !== null && !record.alert_sent_1week) {
        const percentChange = (record.change_1week / record.median_price) * 100;

        if (Math.abs(percentChange) >= 5) {
          // Mark alert as sent
          await sequelize.query(`
            UPDATE market_price_history
            SET alert_sent_1week = true
            WHERE vehicle_id = $1 AND date = $2
          `, {
            bind: [vehicleId, record.date]
          });

          return {
            vehicleId,
            snapshotId: null,
            alertType: 'market_median_change_1week',
            severity: Math.abs(percentChange) >= 10 ? 'critical' : 'warning',
            title: `Market Median ${percentChange > 0 ? 'Increased' : 'Decreased'} ${Math.abs(percentChange).toFixed(1)}% (1 Week)`,
            message: `Market median price has ${percentChange > 0 ? 'increased' : 'decreased'} by $${Math.abs(record.change_1week).toFixed(2)} (${Math.abs(percentChange).toFixed(1)}%) over the last week.`,
            alertData: {
              currentMedian: record.median_price,
              change: record.change_1week,
              percentChange: parseFloat(percentChange.toFixed(2)),
              period: '1week'
            }
          };
        }
      }

      // Check 2-week change (5% threshold)
      if (record.change_2week !== null && !record.alert_sent_2week) {
        const percentChange = (record.change_2week / record.median_price) * 100;

        if (Math.abs(percentChange) >= 5) {
          // Mark alert as sent
          await sequelize.query(`
            UPDATE market_price_history
            SET alert_sent_2week = true
            WHERE vehicle_id = $1 AND date = $2
          `, {
            bind: [vehicleId, record.date]
          });

          return {
            vehicleId,
            snapshotId: null,
            alertType: 'market_median_change_2week',
            severity: Math.abs(percentChange) >= 10 ? 'critical' : 'warning',
            title: `Market Median ${percentChange > 0 ? 'Increased' : 'Decreased'} ${Math.abs(percentChange).toFixed(1)}% (2 Weeks)`,
            message: `Market median price has ${percentChange > 0 ? 'increased' : 'decreased'} by $${Math.abs(record.change_2week).toFixed(2)} (${Math.abs(percentChange).toFixed(1)}%) over the last two weeks.`,
            alertData: {
              currentMedian: record.median_price,
              change: record.change_2week,
              percentChange: parseFloat(percentChange.toFixed(2)),
              period: '2week'
            }
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Failed to check cumulative median change', {
        vehicleId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Alert Type 3: Inventory Surge/Decline (>20% change in market listings)
   */
  async checkInventorySurge(vehicleId, analysisResult) {
    try {
      // Get previous snapshot
      const [previous] = await sequelize.query(`
        SELECT unique_listings
        FROM market_snapshots
        WHERE vehicle_id = $1
        ORDER BY snapshot_date DESC
        OFFSET 1
        LIMIT 1
      `, {
        bind: [vehicleId]
      });

      if (!previous || previous.length === 0) {
        return null; // No previous data to compare
      }

      const previousCount = previous[0].unique_listings;
      const currentCount = analysisResult.snapshot.unique_listings;

      if (previousCount === 0) return null;

      const percentChange = ((currentCount - previousCount) / previousCount) * 100;

      if (Math.abs(percentChange) >= 20) {
        const isSurge = percentChange > 0;

        return {
          vehicleId,
          snapshotId: analysisResult.snapshot.id,
          alertType: isSurge ? 'inventory_surge' : 'inventory_decline',
          severity: 'info',
          title: `Market Inventory ${isSurge ? 'Surge' : 'Decline'}: ${Math.abs(percentChange).toFixed(1)}%`,
          message: `Market inventory for ${analysisResult.vehicle.year} ${analysisResult.vehicle.make} ${analysisResult.vehicle.model} has ${isSurge ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% (from ${previousCount} to ${currentCount} listings).`,
          alertData: {
            previousCount,
            currentCount,
            change: currentCount - previousCount,
            percentChange: parseFloat(percentChange.toFixed(2))
          }
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to check inventory surge', {
        vehicleId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Alert Type 4: Competitor Pricing (competitor >15% cheaper)
   */
  async checkCompetitorPricing(vehicleId, analysisResult) {
    const { snapshot, vehicle, metrics } = analysisResult;

    if (!snapshot || !snapshot.listings_data) {
      return null;
    }

    const ourPrice = parseFloat(vehicle.price);
    const listings = typeof snapshot.listings_data === 'string'
      ? JSON.parse(snapshot.listings_data)
      : snapshot.listings_data;

    // Find significantly cheaper competitors
    const cheapCompetitors = listings.filter(listing => {
      const price = listing.retailListing?.price;
      if (!price) return false;

      const percentCheaper = ((ourPrice - price) / ourPrice) * 100;
      return percentCheaper >= 15;
    });

    if (cheapCompetitors.length > 0) {
      // Find the cheapest competitor
      const cheapest = cheapCompetitors.reduce((min, listing) =>
        listing.retailListing.price < min.retailListing.price ? listing : min
      );

      const cheapestPrice = cheapest.retailListing.price;
      const priceDiff = ourPrice - cheapestPrice;
      const percentCheaper = (priceDiff / ourPrice) * 100;

      return {
        vehicleId,
        snapshotId: snapshot.id,
        alertType: 'competitor_pricing',
        severity: percentCheaper >= 25 ? 'critical' : 'warning',
        title: `Competitor ${percentCheaper.toFixed(1)}% Cheaper`,
        message: `A ${cheapest.vehicle?.year} ${cheapest.vehicle?.make} ${cheapest.vehicle?.model} is listed for $${cheapestPrice.toFixed(2)}, which is $${priceDiff.toFixed(2)} (${percentCheaper.toFixed(1)}%) cheaper than yours. Dealer: ${cheapest.retailListing?.dealerName || 'Unknown'}.`,
        alertData: {
          ourPrice,
          competitorPrice: cheapestPrice,
          priceDiff,
          percentCheaper: parseFloat(percentCheaper.toFixed(2)),
          competitorDealer: cheapest.retailListing?.dealerName,
          competitorCity: cheapest.retailListing?.city,
          competitorState: cheapest.retailListing?.state,
          totalCheaperCompetitors: cheapCompetitors.length
        }
      };
    }

    return null;
  }

  /**
   * Get recent alerts with filtering
   */
  async getRecentAlerts(options = {}) {
    const { severity = null, limit = 50, vehicleId = null, includeDismissed = false } = options;

    try {
      let query = `
        SELECT
          a.*,
          i.year,
          i.make,
          i.model,
          i.trim,
          i.vin,
          i.price
        FROM market_alerts a
        JOIN inventory i ON i.id = a.vehicle_id
        WHERE 1=1
      `;

      const binds = [];
      let bindIndex = 1;

      // Filter out dismissed alerts by default
      if (!includeDismissed) {
        query += ` AND a.dismissed = false`;
      }

      if (severity) {
        query += ` AND a.severity = $${bindIndex}`;
        binds.push(severity);
        bindIndex++;
      }

      if (vehicleId) {
        query += ` AND a.vehicle_id = $${bindIndex}`;
        binds.push(vehicleId);
        bindIndex++;
      }

      query += `
        ORDER BY a.created_at DESC
        LIMIT $${bindIndex}
      `;
      binds.push(limit);

      const [alerts] = await sequelize.query(query, { bind: binds });

      return alerts;
    } catch (error) {
      logger.error('Failed to get recent alerts', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Dismiss an alert
   */
  async dismissAlert(alertId) {
    const marketDb = require('./marketDatabaseService');
    return await marketDb.dismissAlert(alertId);
  }

  /**
   * Dismiss multiple alerts
   */
  async dismissAlerts(alertIds) {
    const marketDb = require('./marketDatabaseService');
    return await marketDb.dismissAlerts(alertIds);
  }
}

module.exports = new MarketAlertService();
