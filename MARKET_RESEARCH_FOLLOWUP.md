# Market Research - Follow-up & Debugging

**Status**: Infrastructure deployed ✅ | Issue RESOLVED ✅

Last updated: 2025-12-08

---

## ✅ RESOLUTION (2025-12-08)

**Issue**: Auto.dev API was returning zero listings due to incorrect parameter name

**Root Cause**:
- **File**: `inventory-system/server/src/services/autodevMarketResearch.js:114`
- **Bug**: Used `retailListing.mileage` instead of `retailListing.miles`
- **Discovery**: Found via Postman testing and Auto.dev API documentation review

**Fix Applied**:
```javascript
// BEFORE (incorrect)
params['retailListing.mileage'] = `${mileageRange.min}-${mileageRange.max}`;

// AFTER (correct)
params['retailListing.miles'] = `${mileageRange.min}-${mileageRange.max}`;
```

**Deployment**: Commit `6b08f84` - Pushed to Railway production

**Test Results** (2018 Ford Fusion):
- ✅ 4 comparable market listings found
- ✅ Median market price: $15,995
- ✅ Your asking price: $14,000 (12.5% below market)
- ✅ Competitive position: Below market
- ✅ Market snapshot saved to database (ID: 1)
- ✅ Price tracking initialized

**Additional Fixes Deployed**:
1. **Enhanced Logging** (Commit `d4b7692`): Fixed winston logger to output metadata in production
2. **Database Transactions** (Commit `2a45c6f`): Added explicit transactions to inventory operations
3. **Export Timing Logs** (Commit `2a45c6f`): Added comprehensive export operation logging

**System Status**: Fully operational - market research running successfully

---

## Current Situation

### ✅ What's Working

1. **Database Tables Created**:
   - `market_snapshots` - Full listing data storage
   - `market_metrics` - Computed metrics (price delta, percentile rank)
   - `market_alerts` - Alert history with email tracking
   - `market_platform_tracking` - VIN tracking across platforms
   - `market_price_history` - Cumulative price changes
   - `system_metrics` - Storage monitoring

2. **Jobs Configured & Running**:
   - Market Research Analysis: Every 3 days
   - Market Cleanup: Weekly
   - Storage Monitoring: Daily

3. **API Integration**:
   - Auto.dev API key configured
   - Service initialized successfully
   - HTTP requests completing without errors

4. **System Health**: All checks pass
   ```javascript
   {
     database: true,
     autodevApi: true,
     emailService: true,
     jobs: { marketResearch: true, marketCleanup: true, storageMonitoring: true }
   }
   ```

---

## ❌ The Issue (RESOLVED)

**Problem**: Auto.dev API calls succeed but return **zero listings** for all vehicles

**Symptoms**:
- API calls complete successfully (no errors)
- Logs show: "Market listings fetched successfully"
- But also: "No market listings found"
- Result: `total: 0` for every vehicle tested

**Vehicles Tested** (all returned 0 results):
- Tesla Model 3 (2022, 114k miles)
- Ford Fusion (2018, 35,250 miles)
- All other inventory vehicles

**Resolution**: Parameter name error fixed - changed `retailListing.mileage` to `retailListing.miles` per Auto.dev API documentation

---

## 🔍 Debugging Done So Far

### Step 1: Verified Configuration ✅
- Auto.dev API key present
- Environment variables configured
- Default ZIP: 95814 (Sacramento)
- Default Radius: 150 miles

### Step 2: Checked System Health ✅
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/health', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
// Result: All systems operational
```

### Step 3: Tested Manual Analysis ✅
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/vehicle/e47bedfd-ab88-486f-a678-19db66eca73b/analyze', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
// Result: Analysis runs but finds 0 listings
```

### Step 4: Added Debug Logging ✅
**File**: `inventory-system/server/src/services/autodevMarketResearch.js:39`

Added URL logging to see exact API parameters:
```javascript
logger.info('Fetching market listings', {
  vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
  params,
  url // Full URL with query params
});
```

**Status**: Deployed to Railway ✅ (commit: 4dd403c)

---

## 🎯 Next Steps to Debug

### Step 1: Test with Correct Vehicle & Check Logs

Run analysis on **2018 Ford Fusion** (good candidate: reasonable mileage, common vehicle):

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/vehicle/41f12051-68f1-415e-86ec-4bbff080d41f/analyze', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
```

**Expected in Response**:
```json
{
  "success": true,
  "data": {
    "vehicle": { "year": 2018, "make": "Ford", "model": "Fusion", "mileage": 35250 },
    "marketData": { "totalListings": 0, "uniqueListings": 0 },
    "analysis": { "message": "No comparable market listings found" }
  }
}
```

**Then check Railway logs** for the full URL:
```bash
railway logs --tail 50 | grep "Fetching market listings" -A 2
```

**Look for**:
```
info: Fetching market listings
  vehicle: "2018 Ford Fusion"
  params: { ... }
  url: "https://api.auto.dev/listings?vehicle.make=Ford&vehicle.model=Fusion&vehicle.year=2018&..."
```

---

### Step 2: Verify API Parameter Format

**Expected Auto.dev API format** (from docs):
```
https://api.auto.dev/listings?
  vehicle.make=Ford
  &vehicle.model=Fusion
  &vehicle.year=2018
  &zip=95814
  &distance=150
  &retailListing.miles=25250-45250    ← CORRECT PARAMETER (was .mileage)
  &limit=100
  &page=1
```

**Current implementation** (`autodevMarketResearch.js:80-107`):
```javascript
buildSearchParams(vehicle, expansion = 0, yearRange = null) {
  const params = {
    'vehicle.make': vehicle.make,
    'vehicle.model': vehicle.model,
    'zip': this.defaultZip,           // 95814
    'distance': this.defaultRadius,   // 150
    'limit': 100,
    'page': 1
  };

  // Year filtering
  if (yearRange && yearRange !== 'exact') {
    const range = parseInt(yearRange.replace('±', ''));
    params['vehicle.year'] = `${vehicle.year - range}-${vehicle.year + range}`;
  } else {
    params['vehicle.year'] = vehicle.year;
  }

  // Mileage range (FIXED: changed .mileage to .miles)
  const mileageRange = this.calculateMileageRange(vehicle.mileage, expansion);
  params['retailListing.miles'] = `${mileageRange.min}-${mileageRange.max}`;

  return params;
}
```

**Mileage brackets** (for 35,250 miles):
- 0-50k: ±10k → Range: 25,250 - 45,250
- 50-100k: ±20k
- 100k+: ±30k

---

### Step 3: Possible Issues to Investigate

**Issue A: Parameter Format**
- ✅ Using `zip` and `distance` (correct)
- ✅ Using `vehicle.make`, `vehicle.model`, `vehicle.year` (correct)
- ❌ Using `retailListing.mileage` (INCORRECT - should be `retailListing.miles`)
- ✅ Parameter values URL-encoded correctly

**Issue B: API Account/Limits**
- ✅ Auto.dev API key valid and active (200 OK responses)
- ✅ No rate limits reached
- ✅ Account in good standing

**Issue C: Search Criteria Too Narrow**
- ZIP 95814 + 150 miles might not have matching inventory
- Mileage range might be too specific
- ✅ **TESTED**: Wider search works fine, not the root cause

**Issue D: Make/Model Naming**
- Auto.dev might use different spellings
- Example: "Ford" vs "FORD", "Fusion" vs "Fusion Sedan"
- ✅ **VERIFIED**: Make/model naming was correct

**Issue E: Parameter Naming (ROOT CAUSE)**
- ❌ **FOUND**: Used `retailListing.mileage` instead of `retailListing.miles`
- ✅ **FIXED**: Changed to correct parameter name per Auto.dev docs
- ✅ **RESULT**: API now returns listings successfully

---

### Step 4: Test Alternative Search Parameters

**Test A: Widen Year Range**
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/vehicle/41f12051-68f1-415e-86ec-4bbff080d41f/analyze', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ yearRange: '±2' }) // 2016-2020
}).then(r => r.json()).then(console.log)
```

**Test B: Manual API Call** (verify Auto.dev API directly)
```bash
curl -X GET "https://api.auto.dev/listings?vehicle.make=Ford&vehicle.model=Fusion&vehicle.year=2018&zip=95814&distance=150&retailListing.mileage=25000-45000&limit=100&page=1" \
  -H "Authorization: Bearer YOUR_AUTODEV_API_KEY" \
  -H "Content-Type: application/json"
```

**Test C: Check Different Vehicle** (common model, low mileage)
- Test with a more common vehicle that should have lots of listings
- Example: Toyota Camry, Honda Accord, etc.

---

## 🔧 Potential Fixes

### Fix 1: Add More Debug Logging
**File**: `inventory-system/server/src/services/autodevMarketResearch.js`

Add response body logging:
```javascript
const data = await response.json();

logger.info('Auto.dev API Response', {
  statusCode: response.status,
  totalResults: data.data?.length || 0,
  pagination: data.pagination,
  firstListing: data.data?.[0] || null // See what a result looks like
});
```

### Fix 2: Widen Search Parameters
**File**: `inventory-system/server/src/services/autodevMarketResearch.js`

Increase default radius or mileage spread:
```javascript
this.defaultRadius = parseInt(process.env.MARKET_RESEARCH_RADIUS) || 250; // Was 150
```

### Fix 3: Add Fallback Logic
If exact match returns 0, automatically retry with wider params:
```javascript
async fetchListings(vehicle, options = {}) {
  let result = await this.fetchWithParams(vehicle, options);

  // If no results, try widening search
  if (result.totalResults === 0) {
    logger.info('No results with exact params, widening search...');
    options.expansion = 10000; // Add 10k to mileage range
    result = await this.fetchWithParams(vehicle, options);
  }

  return result;
}
```

---

## 📋 Action Checklist

**Status**: ALL COMPLETED ✅

- [x] **1. Run Ford Fusion analysis** - Tested successfully, 4 results found
- [x] **2. Check Railway logs** - Full API URL logged and verified
- [x] **3. Verify parameter format** - FOUND BUG: `retailListing.mileage` → `retailListing.miles`
- [x] **4. Test manual API call** - Tested via Postman, confirmed parameter issue
- [x] **5. Check Auto.dev account** - API key valid, 200 OK responses
- [x] **6. Test with wider parameters** - Tested ±2 years successfully
- [x] **7. Add response body logging** - Deployed (commits: d4b7692, db480e9)
- [x] **8. Alternative ZIP codes** - Not needed, issue resolved

---

## 📊 Test Vehicles (ID Reference)

| Vehicle | Year | Make | Model | Mileage | ID |
|---------|------|------|-------|---------|-----|
| **Best Test Candidate** | 2018 | Ford | Fusion | 35,250 | `41f12051-68f1-415e-86ec-4bbff080d41f` |
| High Mileage Tesla | 2022 | Tesla | Model 3 | 114,000 | `e47bedfd-ab88-486f-a678-19db66eca73b` |
| BMW X5 | 2018 | BMW | X5 | 107,200 | `c242042a-24f1-426a-8c36-326b955aedda` |

Use the **Ford Fusion** for testing - it's the most likely to have comparable market listings.

---

## 🔗 Related Files

**Service Implementation**:
- `inventory-system/server/src/services/autodevMarketResearch.js` - API integration
- `inventory-system/server/src/services/marketAnalysisService.js` - Analysis logic
- `inventory-system/server/src/services/marketAlertService.js` - Alert generation

**Routes**:
- `inventory-system/server/src/routes/marketResearch.js` - API endpoints

**Database**:
- `inventory-system/server/src/migrations/1764925830845-create-market-research-tables.js`

**Config**:
- Environment: `R2_PUBLIC_URL`, `AUTODEV_API_KEY`, `MARKET_RESEARCH_ZIP_CODE`, `MARKET_RESEARCH_RADIUS`

---

## 💡 Quick Reference Commands

### Check System Health
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/health', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

### Test Market Analysis (Ford Fusion)
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/vehicle/41f12051-68f1-415e-86ec-4bbff080d41f/analyze', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
```

### Check Railway Logs
```bash
railway logs --tail 100 | grep -E "(Fetching market listings|Auto.dev|market)"
```

### Get Job Status
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/jobs/status', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

## 📝 Notes

- **Auto.dev API Documentation**: Check for any recent API changes
- **ZIP Code 95814**: Sacramento, CA - should have decent used car market
- **150 mile radius**: Covers Sacramento metro + surrounding areas
- **Mileage brackets**: Conservative ranges, might need widening

**Remember**: The infrastructure is solid ✅. This is just a parameter/API issue that should be quick to resolve once we see the actual URL being sent to Auto.dev.
