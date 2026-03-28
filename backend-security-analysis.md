# Backend API Security Analysis

**Date**: 2024-12-25
**Status**: ⚠️ Security Issues Found - Requires Fixes

---

## Summary

The backend API has **good authentication** for admin operations, but **public endpoints expose sensitive data** that should be filtered.

---

## Security Issues

### ❌ Issue 1: Cost/Profit Data Exposed

**Problem**: `cost` field is exposed in public API responses

**Current Response**:
```json
{
  "id": "...",
  "price": "9999.00",
  "cost": "8999.00",    // ⚠️ EXPOSED! Shows $1000 profit margin
  "msrp": null
}
```

**Risk**: Competitors can see your profit margins and undercut prices

**Solution**: Filter `cost` field for non-authenticated users

---

### ❌ Issue 2: Internal User Data Exposed

**Problem**: Creator/updater user information exposed

**Current Response**:
```json
{
  "creator": {
    "id": "uuid",
    "name": "John Admin",
    "email": "john@jpautomotivegroup.com"  // ⚠️ EXPOSED
  }
}
```

**Risk**:
- Email harvesting for spam/phishing
- Social engineering attacks
- Internal staff identification

**Solution**: Remove `creator`/`updater` fields for public access

---

### ❌ Issue 3: Customer Submission Data Exposed

**Problem**: Customer information from pending submissions exposed

**Current Response**:
```json
{
  "sourceSubmission": {
    "id": "uuid",
    "customerName": "Jane Doe",           // ⚠️ EXPOSED
    "customerEmail": "jane@gmail.com",    // ⚠️ EXPOSED
    "customerNotes": "Please call me"     // ⚠️ EXPOSED
  }
}
```

**Risk**:
- Privacy violation (GDPR/CCPA concerns)
- Customer data leak
- Competitive intelligence

**Solution**: Remove `sourceSubmission` field for public access

---

## What's Currently Secure ✅

### Good: Protected Endpoints

These require authentication and work correctly:
- ✅ POST `/api/inventory` (create) - `isManagerOrAdmin`
- ✅ PUT `/api/inventory/:id` (update) - `isManagerOrAdmin`
- ✅ DELETE `/api/inventory/:id` (delete) - `isAdmin`
- ✅ POST `/api/inventory/:id/toggle-featured` - `isManagerOrAdmin`
- ✅ POST `/api/inventory/:id/mark-sold` - `isManagerOrAdmin`
- ✅ POST `/api/inventory/:id/images` (upload) - `isManagerOrAdmin`

### Good: Authentication System

- ✅ OAuth 2.0 (Google/Microsoft)
- ✅ Session-based auth with secure cookies
- ✅ Role-based access control (admin, manager, viewer)
- ✅ CSRF protection
- ✅ Helmet.js security headers

### Good: Rate Limiting

- ✅ Public endpoints have rate limits
- ✅ Prevents abuse and scraping

---

## Recommended Fixes

### Fix 1: Filter Response Based on Auth Status

**Update**: `controllers/inventoryController.js`

```javascript
const getAllInventory = async (req, res) => {
  try {
    // ... existing query logic ...

    const { count, rows: inventory } = await Inventory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order]],
      // Remove sensitive includes for public users
      include: req.user ? [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: PendingSubmission,
          as: 'sourceSubmission',
          attributes: ['id', 'customerName', 'customerEmail']
        }
      ] : []  // No includes for unauthenticated users
    });

    // Filter sensitive fields for public users
    const sanitizedInventory = inventory.map(vehicle => {
      const data = vehicle.toJSON();

      // Remove sensitive fields if not authenticated
      if (!req.user) {
        delete data.cost;           // Remove profit margin
        delete data.creator;        // Remove internal user data
        delete data.updater;        // Remove internal user data
        delete data.sourceSubmission; // Remove customer data
        delete data.createdById;    // Remove internal IDs
        delete data.updatedById;    // Remove internal IDs
      }

      return data;
    });

    res.json({
      inventory: sanitizedInventory,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    // ... error handling ...
  }
};
```

### Fix 2: Update Sequelize Model

Add `defaultScope` to hide sensitive fields by default:

**Update**: `models/Inventory.js`

```javascript
Inventory.init({
  // ... existing fields ...
}, {
  sequelize,
  tableName: 'inventory',
  defaultScope: {
    attributes: {
      exclude: ['cost', 'createdById', 'updatedById']  // Hide by default
    }
  },
  scopes: {
    withSensitiveData: {
      attributes: {}  // Include everything for admin
    }
  }
});
```

Then in controller:
```javascript
// Public access - uses defaultScope (no cost)
const inventory = await Inventory.findAll();

// Admin access - includes everything
const inventory = await Inventory.scope('withSensitiveData').findAll();
```

### Fix 3: Create Serializer Helper

**Create**: `utils/responseSerializer.js`

```javascript
/**
 * Serialize inventory for public API responses
 * Removes sensitive fields
 */
const serializeInventoryPublic = (vehicle) => {
  const data = vehicle.toJSON ? vehicle.toJSON() : vehicle;

  // Fields safe for public
  return {
    id: data.id,
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,
    price: data.price,          // Public price only
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
    mpgCity: data.mpgCity,
    mpgHighway: data.mpgHighway,
    horsepower: data.horsepower,
    features: data.features,
    images: data.images,
    thumbnail: data.thumbnail,
    warrantyDescription: data.warrantyDescription,
    description: data.description,
    marketingTitle: data.marketingTitle,
    featured: data.featured,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
    // ❌ Excluded: cost, creator, updater, sourceSubmission
  };
};

module.exports = { serializeInventoryPublic };
```

---

## Comparison: Old Jekyll vs New Next.js

### Old Jekyll Site (Static)

**Security**: Files were on server filesystem
- ✅ Vehicle data was in `_vehicles/*.md` files
- ✅ Server-side rendering (SSG) meant files never exposed directly
- ✅ GitHub repo could be private
- ⚠️ But still had to be careful what went in frontmatter

### New Next.js Site (API-driven)

**Security**: HTTP API endpoints
- ✅ Same vehicle data, but via public API
- ⚠️ **More exposure risk** if sensitive fields not filtered
- ✅ Better control with authentication middleware
- ✅ Can implement rate limiting, CORS, etc.

**Key Difference**:
- Jekyll: Files never directly accessible (SSG builds them)
- Next.js: API endpoint directly returns JSON (must filter carefully)

---

## Priority Recommendations

### 🚨 High Priority (Fix Before Production)

1. **Remove `cost` field from public responses**
   - Prevents competitor price intelligence
   - Critical for business protection

2. **Remove customer data from public responses**
   - `sourceSubmission.customerEmail`
   - `sourceSubmission.customerName`
   - Privacy violation / GDPR concern

### ⚠️ Medium Priority (Fix Soon)

3. **Remove internal user data**
   - `creator.email`
   - `creator.name`
   - Prevents email harvesting

4. **Add response serializer**
   - Explicit whitelist of public fields
   - Easier to maintain

### ✅ Low Priority (Good to Have)

5. **Add API versioning**
   - `/api/v1/inventory`
   - Allows breaking changes later

6. **Add CORS restrictions**
   - Only allow requests from your domain
   - Prevents scraping

---

## Testing Security Fixes

### Before Fix (Current - Sensitive Data Exposed):

```bash
curl https://jp-auto-inventory-production.up.railway.app/api/inventory?limit=1
```

Response includes:
```json
{
  "cost": "8999.00",              // ❌ EXPOSED
  "creator": {                    // ❌ EXPOSED
    "email": "admin@jpautomotivegroup.com"
  }
}
```

### After Fix (Secure):

```bash
curl https://jp-auto-inventory-production.up.railway.app/api/inventory?limit=1
```

Response should be:
```json
{
  "id": "...",
  "year": 2008,
  "make": "BMW",
  "price": "9999.00",             // ✅ Public price only
  "images": [...],
  // ❌ cost: not present
  // ❌ creator: not present
  // ❌ sourceSubmission: not present
}
```

---

## Implementation Timeline

### Option 1: Quick Fix (30 minutes)
- Add field filtering in `getAllInventory` controller
- Add field filtering in `getInventoryById` controller
- Test with curl
- Deploy to Railway

### Option 2: Proper Fix (2 hours)
- Create response serializer utility
- Update both controllers
- Add Sequelize scopes
- Add tests
- Deploy to Railway

### Recommended: Option 1 Now, Option 2 Later
- Quick fix prevents immediate security issues
- Proper fix can be done in dedicated session

---

## Summary

**Current Status**: ⚠️ Public API exposes sensitive data

**Risk Level**:
- **High**: Cost/profit margin exposure
- **High**: Customer privacy violation
- **Medium**: Internal user data exposure

**Action Required**: Filter sensitive fields before public launch

**Good News**: Authentication and authorization are solid. Just need response filtering.

---

**Next Steps**:
1. Implement field filtering in controllers
2. Test with curl/Postman
3. Verify no sensitive data in responses
4. Deploy to Railway
5. Proceed with frontend integration
