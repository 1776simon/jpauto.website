/**
 * Response Serializer
 *
 * Sanitizes API responses to prevent exposure of sensitive data.
 * Used to filter out internal business data from public API endpoints.
 */

/**
 * Serialize inventory for public API responses
 * Removes sensitive fields like cost, internal user data, and customer information
 *
 * @param {Object} vehicle - Vehicle object (Sequelize instance or plain object)
 * @returns {Object} - Sanitized vehicle object safe for public consumption
 */
const serializeInventoryPublic = (vehicle) => {
  const data = vehicle.toJSON ? vehicle.toJSON() : vehicle;

  // Fields safe for public display
  return {
    // Identification
    id: data.id,
    vin: data.vin,
    stockNumber: data.stockNumber,

    // Basic Info
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,

    // Pricing (PUBLIC ONLY - no cost/profit data)
    price: data.price,          // ✅ Public price
    msrp: data.msrp,            // ✅ Public MSRP
    // ❌ cost: EXCLUDED - internal profit margin

    // Condition & Specs
    mileage: data.mileage,
    exteriorColor: data.exteriorColor,
    interiorColor: data.interiorColor,
    transmission: data.transmission,
    engine: data.engine,
    fuelType: data.fuelType,
    drivetrain: data.drivetrain,
    bodyType: data.bodyType,
    doors: data.doors,
    titleStatus: data.titleStatus,

    // Performance
    mpgCity: data.mpgCity,
    mpgHighway: data.mpgHighway,
    horsepower: data.horsepower,

    // Features & Media
    features: data.features,
    images: data.images,
    primaryImageUrl: data.primaryImageUrl,

    // History & Reports
    previousOwners: data.previousOwners,
    accidentHistory: data.accidentHistory,
    serviceRecordsOnFile: data.serviceRecordsOnFile,
    carfaxAvailable: data.carfaxAvailable,
    carfaxUrl: data.carfaxUrl,

    // Warranty & Marketing
    warrantyDescription: data.warrantyDescription,
    description: data.description,
    marketingTitle: data.marketingTitle,

    // Status & Display
    featured: data.featured,
    status: data.status,
    dateAdded: data.dateAdded,
    soldDate: data.soldDate,

    // Timestamps
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,

    // ❌ EXCLUDED FIELDS (sensitive data):
    // - cost: Internal profit margin
    // - creator: Internal user data (name, email)
    // - updater: Internal user data (name, email)
    // - sourceSubmission: Customer privacy (name, email, notes)
    // - createdBy: Internal user ID
    // - updatedBy: Internal user ID
    // - sourceSubmissionId: Internal reference
    // - latestPhotoModified: Internal tracking
    // - exportedTo*: Internal export tracking
  };
};

/**
 * Serialize inventory for authenticated admin/manager users
 * Includes all fields including sensitive business data
 *
 * @param {Object} vehicle - Vehicle object (Sequelize instance or plain object)
 * @returns {Object} - Complete vehicle object with all fields
 */
const serializeInventoryAdmin = (vehicle) => {
  // For authenticated users, return everything
  return vehicle.toJSON ? vehicle.toJSON() : vehicle;
};

/**
 * Serialize stats for public API responses
 * Removes sensitive financial metrics
 *
 * @param {Object} stats - Statistics object
 * @returns {Object} - Sanitized stats object
 */
const serializeStatsPublic = (stats) => {
  return {
    total: stats.total,
    available: stats.available,
    sold: stats.sold,
    averagePrice: stats.averagePrice,
    averageMileage: stats.averageMileage,
    // ❌ EXCLUDED:
    // - totalCost: Internal cost tracking
    // - totalValue: Can be calculated from price anyway
    // - pending: Internal pending submissions count
  };
};

/**
 * Serialize stats for authenticated admin/manager users
 * Includes all metrics including financial data
 *
 * @param {Object} stats - Statistics object
 * @returns {Object} - Complete stats object
 */
const serializeStatsAdmin = (stats) => {
  return stats; // Return everything for admins
};

module.exports = {
  serializeInventoryPublic,
  serializeInventoryAdmin,
  serializeStatsPublic,
  serializeStatsAdmin
};
