const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

/**
 * Validation rules for vehicle submission
 */
const validateSubmission = [
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage('Valid year is required'),

  body('make')
    .trim()
    .notEmpty()
    .withMessage('Make is required')
    .isLength({ max: 100 })
    .withMessage('Make must be less than 100 characters'),

  body('model')
    .trim()
    .notEmpty()
    .withMessage('Model is required')
    .isLength({ max: 100 })
    .withMessage('Model must be less than 100 characters'),

  body('trim')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Trim must be less than 100 characters'),

  body('vin')
    .optional()
    .trim()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be exactly 17 characters'),

  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be a positive number'),

  body('askingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Asking price must be a positive number'),

  body('customerName')
    .optional()
    .trim()
    .isLength({ max: 255 }),

  body('customerEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),

  body('customerPhone')
    .optional()
    .trim()
    .isLength({ max: 50 }),

  handleValidationErrors
];

/**
 * Validation rules for inventory item
 */
const validateInventory = [
  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage('Valid year is required'),

  body('make')
    .trim()
    .notEmpty()
    .withMessage('Make is required')
    .isLength({ max: 100 }),

  body('model')
    .trim()
    .notEmpty()
    .withMessage('Model is required')
    .isLength({ max: 100 }),

  body('vin')
    .trim()
    .notEmpty()
    .withMessage('VIN is required')
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be exactly 17 characters'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('mileage')
    .isInt({ min: 0 })
    .withMessage('Mileage must be a positive number'),

  body('status')
    .optional()
    .isIn(['available', 'sold', 'pending', 'hold'])
    .withMessage('Invalid status'),

  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be true or false'),

  handleValidationErrors
];

/**
 * Validation for updating inventory
 */
const validateInventoryUpdate = [
  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 }),

  body('make')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('model')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('price')
    .optional()
    .isFloat({ min: 0 }),

  body('mileage')
    .optional()
    .isInt({ min: 0 }),

  body('status')
    .optional()
    .isIn(['available', 'sold', 'pending', 'hold']),

  handleValidationErrors
];

/**
 * Validation for UUID parameters
 */
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  handleValidationErrors
];

/**
 * Validation for submission approval/rejection
 */
const validateSubmissionReview = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either "approve" or "reject"'),

  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting'),

  handleValidationErrors
];

/**
 * Validation for user role update
 */
const validateUserRole = [
  body('role')
    .isIn(['admin', 'manager', 'viewer'])
    .withMessage('Role must be admin, manager, or viewer'),

  handleValidationErrors
];

/**
 * Validation for pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  handleValidationErrors
];

/**
 * Validation rules for financing application
 */
const validateFinancingApplication = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
  body('ssn').trim().notEmpty().withMessage('SSN is required'),
  body('birthDate').trim().notEmpty().withMessage('Birth date is required'),
  body('currentAddress').trim().notEmpty().withMessage('Current address is required'),
  body('currentCity').trim().notEmpty().withMessage('City is required'),
  body('currentState').trim().notEmpty().withMessage('State is required'),
  body('currentZip').trim().matches(/^[0-9]{5}$/).withMessage('Valid 5-digit zip code is required'),
  body('residenceStatus').trim().notEmpty().withMessage('Residence status is required'),
  body('monthlyPayment').isFloat({ min: 0 }).withMessage('Monthly payment must be 0 or greater'),
  body('yearsAtResidence').isInt({ min: 0, max: 50 }).withMessage('Years at residence must be between 0 and 50'),
  body('monthsAtResidence').isInt({ min: 0, max: 11 }).withMessage('Months at residence must be between 0 and 11'),
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
  body('grossMonthlyIncome').isFloat({ min: 0 }).withMessage('Gross monthly income must be 0 or greater'),
  body('yearsAtCompany').isInt({ min: 0, max: 50 }).withMessage('Years at company must be between 0 and 50'),
  body('monthsAtCompany').isInt({ min: 0, max: 11 }).withMessage('Months at company must be between 0 and 11'),
  handleValidationErrors
];

module.exports = {
  validateSubmission,
  validateInventory,
  validateInventoryUpdate,
  validateUUID,
  validateSubmissionReview,
  validateUserRole,
  validatePagination,
  validateFinancingApplication,
  handleValidationErrors
};
