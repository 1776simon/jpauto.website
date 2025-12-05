/**
 * Market History Routes
 *
 * API endpoints for historical market data analysis
 */

const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const logger = require('../config/logger');

// Apply authentication middleware to all routes
router.use(isAuthenticated);

/**
 * GET /api/market-research/history/aggregate
 * Get aggregate historical metrics over time
 */
router.get('/aggregate', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [metrics] = await sequelize.query(`
      SELECT
        DATE(ms.snapshot_date) as date,
        COUNT(DISTINCT ms.vehicle_id) as vehicles_analyzed,
        AVG(ms.median_price) as avg_market_median,
        AVG(mm.price_delta_percent) as avg_price_delta_percent,
        AVG(mm.percentile_rank) as avg_percentile_rank,
        COUNT(CASE WHEN mm.competitive_position = 'competitive' THEN 1 END) as competitive_count,
        COUNT(CASE WHEN mm.competitive_position = 'above_market' THEN 1 END) as above_market_count,
        COUNT(CASE WHEN mm.competitive_position = 'below_market' THEN 1 END) as below_market_count
      FROM market_snapshots ms
      LEFT JOIN market_metrics mm ON mm.snapshot_id = ms.id
      WHERE ms.snapshot_date >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(ms.snapshot_date)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get aggregate history', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/history/trends
 * Get week-over-week trend comparisons
 */
router.get('/trends', async (req, res) => {
  try {
    const [trends] = await sequelize.query(`
      WITH current_week AS (
        SELECT
          AVG(ms.median_price) as avg_median,
          AVG(mm.percentile_rank) as avg_rank,
          COUNT(*) as count
        FROM market_snapshots ms
        LEFT JOIN market_metrics mm ON mm.snapshot_id = ms.id
        WHERE ms.snapshot_date >= NOW() - INTERVAL '7 days'
      ),
      previous_week AS (
        SELECT
          AVG(ms.median_price) as avg_median,
          AVG(mm.percentile_rank) as avg_rank,
          COUNT(*) as count
        FROM market_snapshots ms
        LEFT JOIN market_metrics mm ON mm.snapshot_id = ms.id
        WHERE ms.snapshot_date >= NOW() - INTERVAL '14 days'
          AND ms.snapshot_date < NOW() - INTERVAL '7 days'
      )
      SELECT
        cw.avg_median as current_avg_median,
        pw.avg_median as previous_avg_median,
        (cw.avg_median - pw.avg_median) as median_change,
        CASE
          WHEN pw.avg_median > 0 THEN
            ((cw.avg_median - pw.avg_median) / pw.avg_median * 100)
          ELSE NULL
        END as median_change_percent,
        cw.avg_rank as current_avg_rank,
        pw.avg_rank as previous_avg_rank,
        (cw.avg_rank - pw.avg_rank) as rank_change,
        cw.count as current_count,
        pw.count as previous_count
      FROM current_week cw, previous_week pw
    `);

    res.json({
      success: true,
      data: trends[0] || {}
    });
  } catch (error) {
    logger.error('Failed to get trends', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/market-research/history/sold-analysis
 * Get aggregate analysis of sold vehicles
 * User specified: Aggregate only, not per-vehicle
 */
router.get('/sold-analysis', async (req, res) => {
  try {
    const [analysis] = await sequelize.query(`
      SELECT
        COUNT(DISTINCT i.id) as total_sold,
        AVG(mm.days_in_market) as avg_days_in_market,
        AVG(mm.price_delta_percent) as avg_price_delta_percent,
        AVG(mm.percentile_rank) as avg_percentile_rank,
        COUNT(CASE WHEN mm.competitive_position = 'competitive' THEN 1 END) as sold_competitive,
        COUNT(CASE WHEN mm.competitive_position = 'above_market' THEN 1 END) as sold_above_market,
        COUNT(CASE WHEN mm.competitive_position = 'below_market' THEN 1 END) as sold_below_market
      FROM inventory i
      LEFT JOIN LATERAL (
        SELECT * FROM market_metrics
        WHERE vehicle_id = i.id
        ORDER BY created_at DESC
        LIMIT 1
      ) mm ON true
      WHERE i.status = 'sold'
        AND i.date_sold >= NOW() - INTERVAL '6 months'
    `);

    res.json({
      success: true,
      data: analysis[0] || {}
    });
  } catch (error) {
    logger.error('Failed to get sold analysis', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
