const express = require('express');
const router = express.Router();
const {
  exportJekyll,
  exportDealerCenter,
  exportAutoTrader,
  exportCarGurus,
  exportFacebook,
  exportAndUploadDealerCenter,
  getExportHistory
} = require('../controllers/exportsController');
const { isManagerOrAdmin } = require('../middleware/auth');

/**
 * All export routes require Manager or Admin role
 */

// Export to Jekyll
router.post('/jekyll',
  isManagerOrAdmin,
  exportJekyll
);

// Export to Dealer Center
router.post('/dealer-center',
  isManagerOrAdmin,
  exportDealerCenter
);

// Export to Dealer Center and upload to FTP
router.post('/dealer-center/upload',
  isManagerOrAdmin,
  exportAndUploadDealerCenter
);

// Export to AutoTrader
router.post('/autotrader',
  isManagerOrAdmin,
  exportAutoTrader
);

// Export to CarGurus
router.post('/cargurus',
  isManagerOrAdmin,
  exportCarGurus
);

// Export to Facebook Marketplace
router.post('/facebook',
  isManagerOrAdmin,
  exportFacebook
);

// Get export history/statistics
router.get('/history',
  isManagerOrAdmin,
  getExportHistory
);

module.exports = router;
