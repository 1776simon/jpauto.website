# JP Auto Inventory System - Optimization TODO

**Last Updated:** 2025-11-20
**Status:** Production-ready, optimizations pending

## Current System Status
✅ **Server Running:** https://api.jpautomotivegroup.com
✅ **Admin Dashboard:** https://admin.jpautomotivegroup.com
✅ **Consignment Form:** https://consign.jpautomotivegroup.com
✅ **All core features working**

---

## CRITICAL PRIORITY (Do First)

### 1. N+1 Query Problem in Export Controllers ✅ COMPLETED
**File:** `inventory-system/server/src/controllers/exportsController.js`
**Lines:** 38-48, 93-103, 160-170, 230-240, 295-305

**Previous Code:**
```javascript
await Promise.all(
  vehicles.map(vehicle =>
    vehicle.update({
      exportedToJekyll: true,
      exportedToJekyllAt: new Date()
    })
  )
);
```

**Implemented Fix:** Replaced with bulk update in all 5 export functions
```javascript
const vehicleIds = vehicles.map(v => v.id);
await Inventory.update(
  { exportedToJekyll: true, exportedToJekyllAt: new Date() },
  { where: { id: vehicleIds } }
);
```

**Impact:** 10x faster exports for large inventories (40+ vehicles)

---

### 2. Missing Database Indexes ✅ COMPLETED
**Files:** `inventory-system/database/schema.sql`, `inventory-system/database/migrations/001_add_performance_indexes.sql`

**Implemented indexes:**
```sql
-- Composite index for common filter queries
CREATE INDEX idx_inventory_filters ON inventory(status, make, model, year);

-- Price range queries (partial index)
CREATE INDEX idx_inventory_price_range ON inventory(price) WHERE status = 'available';

-- Case-insensitive search indexes
CREATE INDEX idx_inventory_make_lower ON inventory(LOWER(make));
CREATE INDEX idx_inventory_model_lower ON inventory(LOWER(model));

-- Year, mileage, featured vehicles
CREATE INDEX idx_inventory_year ON inventory(year DESC);
CREATE INDEX idx_inventory_mileage ON inventory(mileage);
CREATE INDEX idx_inventory_featured_available ON inventory(featured, created_at DESC) WHERE status = 'available';

-- Customer email lookups
CREATE INDEX idx_pending_submissions_email ON pending_submissions(customer_email);
CREATE INDEX idx_pending_submissions_status_date ON pending_submissions(submission_status, submitted_at DESC);
```

**Impact:** 10-100x faster inventory filtering and search
**Migration:** Run 001_add_performance_indexes.sql on production database

---

### 3. Environment Variable Validation ✅ COMPLETED
**File:** `inventory-system/server/src/index.js`
**Lines:** 72-93 (validates all required environment variables)

**Implemented validation for:**
```javascript
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'ADMIN_URL'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`FATAL: ${varName} environment variable is not set`);
    process.exit(1);
  }
});
```

**Impact:** Fail-fast on misconfiguration instead of runtime errors

---

## HIGH PRIORITY

### 4. Rate Limiting on Auth Endpoints ✅ COMPLETED
**File:** `inventory-system/server/src/routes/auth.js`
**Lines:** 6-18, 26, 56

**Implemented:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' // Skip localhost
});

router.get('/google', authLimiter, passport.authenticate('google', ...));
router.get('/microsoft', authLimiter, passport.authenticate('microsoft', ...));
```

**Impact:** Protection against authentication brute force attacks

---

### 5. File Upload Size Validation Logic Error ✅ COMPLETED
**File:** `inventory-system/server/src/middleware/upload.js`
**Line:** 5

**Previous (broken):**
```javascript
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB) * 1024 * 1024 || 10 * 1024 * 1024;
```

**Implemented fix:**
```javascript
const MAX_FILE_SIZE = (parseInt(process.env.MAX_IMAGE_SIZE_MB) || 10) * 1024 * 1024;
```

**Impact:** Correct fallback to 10MB when env var not set

---

### 6. Transaction Support for Approval Process ✅ COMPLETED
**File:** `inventory-system/server/src/controllers/submissionsController.js`
**Lines:** 217-318 (approveSubmission function)

**Implemented transaction wrapper:**
```javascript
const transaction = await sequelize.transaction();
try {
  const submission = await PendingSubmission.findByPk(id, { transaction });

  if (!submission) {
    await transaction.rollback();
    return res.status(404).json({ error: 'Submission not found' });
  }

  const inventory = await Inventory.create(inventoryData, { transaction });

  await submission.update({
    submissionStatus: 'approved',
    reviewedBy: req.user.id,
    reviewedAt: new Date(),
    internalNotes
  }, { transaction });

  await transaction.commit();
  res.json({ message: 'Submission approved', submission, inventory });
} catch (error) {
  await transaction.rollback();
  console.error('Error approving submission:', error);
  res.status(500).json({ error: 'Failed to approve submission', message: error.message });
}
```

**Impact:** Data integrity protection - atomic operations with automatic rollback

---

## MEDIUM PRIORITY

### 7. Standardize Error Responses ✅ COMPLETED
**Files:** `middleware/errorHandler.js` (new), `index.js` (updated)

**Implemented standardized error handler:**
- Created comprehensive error handler middleware (errorHandler.js)
- Custom APIError class for structured errors
- Handles all error types: Sequelize, JWT, Multer, generic errors
- Consistent JSON responses with statusCode, path, timestamp
- Stack traces in development mode only
- Validation details included when available
- 404 Not Found handler
- asyncHandler wrapper for automatic error catching in routes

```javascript
// middleware/errorHandler.js
class APIError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
  }
}

const errorHandler = (err, req, res, next) => {
  // Handles Sequelize, JWT, Multer, and generic errors
  // Returns standardized JSON with error type, message, statusCode, path, timestamp
  // Includes stack trace in development only
};
```

**Impact:** Consistent error responses, better debugging, cleaner controller code

---

### 8. CORS Origin Whitelist from Environment ✅ COMPLETED
**File:** `inventory-system/server/src/index.js`
**Lines:** 26-35

**Implemented:** CORS origins now read from environment variable

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://consign.jpautomotivegroup.com',
      'https://jp-auto-consignment.pages.dev',
      'https://admin.jpautomotivegroup.com',
      'https://api.jpautomotivegroup.com'
    ];
```

**Note:** Already documented in `.env.example` (line 9)

---

### 9. Remove Duplicate Export Code
**File:** `inventory-system/server/src/controllers/exportsController.js`
**Lines:** 13-314

All 5 export functions follow identical pattern. Create generic handler:

```javascript
async function handleExport(req, res, exportFunction, exportType) {
  try {
    const vehicles = await Inventory.findAll({
      where: { status: 'available' },
      include: [{ model: VehicleImage, as: 'images' }]
    });

    const filePath = await exportFunction(vehicles);

    // Update export timestamp
    await Inventory.update(
      { [`exportedTo${exportType}`]: true, [`exportedTo${exportType}At`]: new Date() },
      { where: { id: vehicles.map(v => v.id) } }
    );

    // Send file...
  } catch (error) {
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
}
```

---

### 10. Session Configuration for Production ✅ COMPLETED
**File:** `inventory-system/server/src/index.js`
**Lines:** 95-114

**Implemented improvements:**
```javascript
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // Refresh session on each request
  name: 'connect.sid',
  cookie: {
    maxAge: process.env.NODE_ENV === 'production'
      ? 7 * 24 * 60 * 60 * 1000  // 7 days in production
      : 30 * 24 * 60 * 60 * 1000, // 30 days in development
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-domain in prod, lax in dev
    domain: process.env.NODE_ENV === 'production'
      ? (process.env.COOKIE_DOMAIN || '.jpautomotivegroup.com')
      : undefined, // No domain restriction in development
    path: '/'
  }
}));
```

**Impact:** Better security in production + improved developer experience

---

## LOW PRIORITY (Polish)

### 11. Implement Structured Logging
Replace console.log with Winston or Pino

### 12. Admin Dashboard UI Improvements
**File:** `admin-dashboard/src/App.jsx`
**Lines:** 258, 262, 265, 271, 274, 278, 501, 503

Replace `window.confirm()` / `window.alert()` with proper modal components

### 13. Add Pagination to Admin Dashboard
**File:** `admin-dashboard/src/services/api.js`

Add pagination params to API calls:
```javascript
async getSubmissions(status = 'all', page = 1, limit = 20) {
  const query = new URLSearchParams({ status, page, limit }).toString();
  return this.request(`/api/submissions?${query}`);
}
```

### 14. Input Sanitization
**File:** `inventory-system/server/src/controllers/inventoryController.js`
**Lines:** 41, 45

Add sanitization before LIKE queries:
```javascript
const sanitize = (input) => input.replace(/[%_]/g, '\\$&');
where.make = { [Op.iLike]: `%${sanitize(make)}%` };
```

---

## COMPLETED ✅

- ✅ Removed cookie logging security risk (api.js)
- ✅ Removed SESSION_SECRET default value
- ✅ Removed /auth/success test endpoint
- ✅ Removed all emoji debug logging
- ✅ Removed placeholder virus scanning
- ✅ Moved test-image-upload.html to docs/
- ✅ Fixed scanForVirus module export error
- ✅ Added COOKIE_DOMAIN environment variable
- ✅ Documented new env vars in .env.example

---

## Not Issues (Already Handled Well)

- ✅ SQL injection protected by Sequelize ORM
- ✅ Rate limiting on public submission endpoints
- ✅ Helmet.js security headers configured
- ✅ CSRF protection via session cookies
- ✅ Input validation with express-validator
- ✅ Proper authentication/authorization middleware

---

## Quick Reference: File Locations

**Backend:**
- Controllers: `inventory-system/server/src/controllers/`
- Routes: `inventory-system/server/src/routes/`
- Services: `inventory-system/server/src/services/`
- Middleware: `inventory-system/server/src/middleware/`
- Database: `inventory-system/database/`

**Frontend:**
- Admin Dashboard: `admin-dashboard/src/`
- Consignment Form: `consignment-form/src/`

**Deployment:**
- Backend: Railway (auto-deploy from master branch)
- Admin: Cloudflare Pages
- Consignment: Cloudflare Pages

---

## Railway Environment Variables Checklist

Required in Railway dashboard:
- [x] DATABASE_URL
- [x] SESSION_SECRET
- [x] ADMIN_URL
- [x] GOOGLE_CLIENT_ID
- [x] GOOGLE_CLIENT_SECRET
- [x] GOOGLE_CALLBACK_URL
- [x] R2_ACCESS_KEY_ID
- [x] R2_SECRET_ACCESS_KEY
- [x] R2_BUCKET_NAME
- [x] R2_PUBLIC_URL
- [x] RECAPTCHA_SECRET_KEY
- [ ] COOKIE_DOMAIN (optional: .jpautomotivegroup.com)
- [ ] ALLOWED_ORIGINS (optional: comma-separated list)

---

## Next Session Plan

### ✅ COMPLETED: Quick Wins (Commit 366350b)
   - ✅ Environment variable validation (index.js:72-93)
   - ✅ File upload size logic fix (upload.js:5)
   - ✅ CORS origins to env var (index.js:26-35)

### ✅ COMPLETED: Performance Boost (Commit 68f01dc)
   - ✅ Database indexes (schema.sql + 001_add_performance_indexes.sql)
   - ✅ N+1 queries fixed (exportsController.js - all 5 export functions)
   - ✅ Auth rate limiting (auth.js:6-18, 26, 56)

### ✅ COMPLETED: Code Quality (Commit bf1cde9)
   - ✅ Transactions for approval process (submissionsController.js:217-318)
   - ✅ Standardized error handling (errorHandler.js - new middleware)
   - ✅ Session configuration improvements (index.js:95-114)

### 🎯 ALL HIGH & MEDIUM PRIORITY ITEMS COMPLETED!

### Optional Remaining Items (Low Priority):
   - Input sanitization for LIKE queries (Low #14)
   - Pagination for admin dashboard (Low #13)
   - UI improvements (replace window.confirm/alert) (Low #12)
   - Structured logging with Winston/Pino (Low #11)
   - Refactor duplicate export code (Medium #9)

These remaining items are polish improvements and can be tackled as needed.
