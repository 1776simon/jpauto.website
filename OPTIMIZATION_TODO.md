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

### 1. N+1 Query Problem in Export Controllers
**File:** `inventory-system/server/src/controllers/exportsController.js`
**Lines:** 39-46, 92-99, 157-164, 225-232, 288-295

**Current Code:**
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

**Fix:** Replace with bulk update
```javascript
await Inventory.update(
  { exportedToJekyll: true, exportedToJekyllAt: new Date() },
  { where: { id: vehicles.map(v => v.id) } }
);
```

**Impact:** 10x faster exports for large inventories (40+ vehicles)

---

### 2. Missing Database Indexes
**File:** `inventory-system/database/schema.sql`

**Add these indexes:**
```sql
-- Composite index for common filter queries
CREATE INDEX idx_inventory_filters ON inventory(status, make, model, year);

-- Price range queries
CREATE INDEX idx_inventory_price_range ON inventory(price) WHERE status = 'available';

-- Customer lookups
CREATE INDEX idx_pending_submissions_email ON pending_submissions(customer_email);

-- Featured vehicles
CREATE INDEX idx_inventory_featured ON inventory(is_featured) WHERE status = 'available';
```

**Impact:** Much faster inventory filtering and search

---

### 3. Environment Variable Validation ✅ PARTIALLY DONE
**File:** `inventory-system/server/src/index.js`
**Lines:** 71-75 (currently only validates SESSION_SECRET)

**Add validation for:**
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

### 4. Rate Limiting on Auth Endpoints
**File:** `inventory-system/server/src/routes/auth.js`
**Current:** No rate limiting (vulnerable to brute force)

**Fix:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' }
});

router.get('/google', authLimiter, passport.authenticate('google', ...));
router.get('/microsoft', authLimiter, passport.authenticate('microsoft', ...));
```

**Impact:** Protection against brute force attacks

---

### 5. File Upload Size Validation Logic Error
**File:** `inventory-system/server/src/middleware/upload.js`
**Line:** 5

**Current (broken):**
```javascript
const MAX_FILE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB) * 1024 * 1024 || 10 * 1024 * 1024;
```

**Fix:**
```javascript
const MAX_FILE_SIZE = (parseInt(process.env.MAX_IMAGE_SIZE_MB) || 10) * 1024 * 1024;
```

**Impact:** Correct fallback to 10MB when env var not set

---

### 6. Transaction Support for Approval Process
**File:** `inventory-system/server/src/controllers/submissionsController.js`
**Lines:** 216-308 (approveSubmission function)

**Add transaction wrapper:**
```javascript
const transaction = await sequelize.transaction();
try {
  const inventory = await Inventory.create(inventoryData, { transaction });

  await submission.update({
    status: 'approved',
    reviewedBy: req.user.id,
    reviewedAt: new Date()
  }, { transaction });

  await transaction.commit();
  res.json({ success: true, inventory });
} catch (error) {
  await transaction.rollback();
  console.error('Approval failed:', error);
  res.status(500).json({ error: 'Approval failed', message: error.message });
}
```

**Impact:** Data integrity protection

---

## MEDIUM PRIORITY

### 7. Standardize Error Responses
**Files:** All controllers

**Current:** Inconsistent formats
- Some: `{ error, message }`
- Others: `{ error }` only
- Dev mode conditionally adds stack traces

**Create middleware:**
```javascript
// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  const error = {
    error: err.name || 'Error',
    message: err.message || 'An error occurred',
    statusCode: err.statusCode || 500,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  res.status(error.statusCode).json(error);
};
```

---

### 8. CORS Origin Whitelist from Environment
**File:** `inventory-system/server/src/index.js`
**Lines:** 26-34

**Current:** Hardcoded array

**Fix:**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173'
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

### 10. Session Configuration for Production
**File:** `inventory-system/server/src/index.js`
**Lines:** 77-91

**Current issues:**
- 30-day timeout (line 84) is too long for admin access
- Missing `rolling: true` to refresh on activity
- `sameSite: 'none'` might break localhost

**Recommendation:**
```javascript
cookie: {
  maxAge: process.env.NODE_ENV === 'production'
    ? 7 * 24 * 60 * 60 * 1000  // 7 days in prod
    : 30 * 24 * 60 * 60 * 1000, // 30 days in dev
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/'
},
rolling: true  // Refresh session on activity
```

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

1. Start with Quick Wins (Option A):
   - Environment variable validation
   - File upload size logic fix
   - CORS origins to env var

2. Then Performance Boost (Option B):
   - Add database indexes
   - Fix N+1 queries
   - Add auth rate limiting

3. Time permitting (Option C):
   - Transactions for critical ops
   - Standardize error handling
   - Refactor duplicate code

**Estimated Total Time:** 2-3 hours for full optimization pass
