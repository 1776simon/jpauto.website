---
paths:
  - inventory-system/server/src/services/autodevMarketResearch.js
  - inventory-system/server/src/services/marketAlertService.js
  - inventory-system/server/src/services/marketAnalysisService.js
  - inventory-system/server/src/services/marketDatabaseService.js
  - inventory-system/server/src/routes/marketResearch.js
  - inventory-system/server/src/routes/marketHistory.js
  - inventory-system/server/src/routes/marketSystem.js
  - admin-panel/src/pages/MarketResearch.tsx
---

# Market Research System

## Overview

The Market Research System provides automated pricing insights and competitive analysis for inventory vehicles by comparing them against current market listings.

**Key Features**:
- Automated market price analysis
- Pricing recommendations (competitive, high, low)
- Price alerts for overpriced/underpriced vehicles
- Historical price tracking
- VIN-based valuation caching
- Admin dashboard with visual insights

---

## Architecture

### Data Flow

```
Inventory Vehicle
    ↓
Market Research Job (every 3 days)
    ↓
auto.dev API (find comparable vehicles)
    ↓
Market Analysis Service (calculate statistics)
    ↓
Market Alert Service (detect pricing issues)
    ↓
Database (store results & history)
    ↓
Admin Dashboard (display insights)
```

---

## Backend Services

### 1. autodevMarketResearch.js

**Purpose**: Integration with auto.dev API for fetching market data

**Main Function**: `searchComparableVehicles(params)`

**Parameters**:
```javascript
{
  year: 2020,
  make: 'Toyota',
  model: 'Camry',
  mileage: 45000,
  mileageRange: 20000,  // ±20k miles
  radius: 250,          // miles
  daysListed: 90        // only recent listings
}
```

**Process**:
1. Construct search query for auto.dev API
2. Apply filters:
   - Same year, make, model
   - Mileage within ±20,000 miles (configurable)
   - Listed in last 90 days
   - Within 250 mile radius
3. Send GET request to auto.dev endpoint
4. Parse response and extract vehicle listings
5. Return array of comparable vehicles

**Response Format**:
```javascript
[
  {
    id: "listing_123",
    year: 2020,
    make: "Toyota",
    model: "Camry",
    trim: "SE",
    price: 22500,
    mileage: 42000,
    location: "Los Angeles, CA",
    listedDate: "2024-01-15",
    url: "https://...",
    dealer: "ABC Motors"
  },
  // ... more vehicles
]
```

**Error Handling**:
- Network errors: Retry up to 3 times
- API rate limits: Respect and queue requests
- Invalid responses: Log and skip
- No results: Return empty array (not an error)

**Configuration**:
```env
AUTODEV_API_KEY=your_api_key
AUTODEV_API_URL=https://auto.dev/api/v1
```

---

### 2. marketAnalysisService.js

**Purpose**: Calculate market statistics and pricing recommendations

**Main Function**: `analyzeMarketData(ourVehicle, comparables)`

**Process**:
1. Filter comparables:
   - Remove outliers (prices >3 standard deviations from mean)
   - Validate data completeness
2. Calculate statistics:
   - Median price (primary metric)
   - Minimum price
   - Maximum price
   - Average price
   - Sample size
3. Generate pricing recommendation:
   - Compare our price to median
   - Calculate percentage difference
   - Assign category:
     - **Competitive**: Within ±10% of median
     - **High**: >10% above median
     - **Low**: >10% below median
4. Create detailed analysis report

**Response Format**:
```javascript
{
  medianPrice: 22500,
  minPrice: 19800,
  maxPrice: 25900,
  avgPrice: 22650,
  sampleSize: 45,
  priceRecommendation: 'competitive',
  ourPrice: 23000,
  priceDifferencePercent: 2.2,
  comparableVehicles: [...],  // top 10 closest matches
  analysisDate: '2024-01-20T10:30:00Z'
}
```

**Recommendation Logic**:
```javascript
const percentDiff = ((ourPrice - medianPrice) / medianPrice) * 100;

if (percentDiff > 10) return 'high';      // Overpriced
if (percentDiff < -10) return 'low';      // Underpriced
return 'competitive';                      // Well-priced
```

**Quality Checks**:
- Minimum sample size: 5 vehicles (configurable)
- Data recency: Listings from last 90 days
- Price validity: Must be between $1,000 and $500,000

---

### 3. marketAlertService.js

**Purpose**: Create and manage pricing alerts

**Main Functions**:

#### `createPricingAlert(inventoryId, analysisResult)`

Creates an alert if pricing is outside acceptable range.

**Alert Thresholds**:
- **Warning**: 10-15% above/below median
- **Critical**: >15% above/below median

**Alert Types**:
- `overpriced` - Vehicle priced too high
- `underpriced` - Vehicle priced too low
- `no_market_data` - Insufficient comparables found

**Alert Structure**:
```javascript
{
  inventoryId: 'uuid',
  alertType: 'overpriced',
  severity: 'warning',  // or 'critical'
  message: 'Vehicle is priced 12% above market median',
  metadata: {
    ourPrice: 25000,
    medianPrice: 22321,
    percentDiff: 12.0,
    sampleSize: 38
  },
  dismissed: false,
  createdAt: '2024-01-20T10:30:00Z'
}
```

#### `dismissAlert(alertId, userId)`

Marks alert as dismissed by user.

#### `getActiveAlerts()`

Returns all non-dismissed alerts for dashboard display.

---

### 4. marketDatabaseService.js

**Purpose**: Persist market research data and history

**Main Functions**:

#### `saveMarketResearch(inventoryId, analysisResult)`

Saves market research results to `market_research_results` table.

**Process**:
1. Check if results already exist for vehicle
2. If exists: Update existing record
3. If new: Create new record
4. Set `last_analyzed_at` timestamp
5. Store comparable vehicles as JSONB
6. Return saved record

#### `savePrice History(inventoryId, priceData)`

Tracks price changes over time in `market_price_history` table.

**Saved Data**:
```javascript
{
  inventoryId: 'uuid',
  ourPrice: 23000,
  medianMarketPrice: 22500,
  minMarketPrice: 19800,
  sampleSize: 45,
  recordedAt: '2024-01-20T10:30:00Z'
}
```

**Use Cases**:
- Price trend charts
- Historical pricing accuracy
- Market volatility analysis

#### `getMarketResearch(inventoryId)`

Retrieves latest market research for a vehicle.

#### `deleteOldData(daysOld)`

Cleanup function for removing outdated research data (called by cleanup job).

---

## API Routes

### Market Research Routes (`/api/market-research`)

**Location**: `src/routes/marketResearch.js`

#### `GET /api/market-research`

Get overview of all vehicles with market research data.

**Response**:
```javascript
{
  success: true,
  data: {
    vehicles: [
      {
        id: 'uuid',
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        price: 23000,
        marketResearch: {
          medianPrice: 22500,
          priceRecommendation: 'competitive',
          lastAnalyzedAt: '2024-01-20'
        }
      },
      // ...
    ],
    alerts: [
      {
        id: 'uuid',
        vehicleId: 'uuid',
        alertType: 'overpriced',
        severity: 'warning',
        message: '...'
      },
      // ...
    ],
    summary: {
      totalVehicles: 50,
      analyzed: 45,
      needsAnalysis: 5,
      overpriced: 3,
      underpriced: 2,
      competitive: 40
    }
  }
}
```

#### `GET /api/market-research/:vehicleId`

Get detailed market research for specific vehicle.

**Response**:
```javascript
{
  success: true,
  data: {
    vehicle: { /* inventory data */ },
    marketResearch: {
      medianPrice: 22500,
      minPrice: 19800,
      maxPrice: 25900,
      sampleSize: 45,
      priceRecommendation: 'competitive',
      comparableVehicles: [
        {
          price: 22800,
          mileage: 43000,
          location: 'Los Angeles',
          dealer: 'ABC Motors',
          url: 'https://...'
        },
        // ... top 10 comparables
      ],
      lastAnalyzedAt: '2024-01-20T10:30:00Z'
    }
  }
}
```

#### `POST /api/market-research/analyze/:vehicleId`

Trigger manual market analysis for a vehicle.

**Process**:
1. Fetch vehicle from inventory
2. Call autodevMarketResearch service
3. Run marketAnalysisService
4. Create alerts if needed
5. Save results to database
6. Return analysis

**Response**:
```javascript
{
  success: true,
  data: {
    medianPrice: 22500,
    priceRecommendation: 'competitive',
    sampleSize: 45,
    alertCreated: false
  },
  message: 'Market analysis completed successfully'
}
```

#### `DELETE /api/market-research/:vehicleId`

Delete market research data for a vehicle (admin only).

#### `POST /api/market-research/alerts/:alertId/dismiss`

Dismiss a pricing alert.

---

### Market History Routes (`/api/market-research/history`)

**Location**: `src/routes/marketHistory.js`

#### `GET /api/market-research/history/:vehicleId`

Get price history for a vehicle.

**Response**:
```javascript
{
  success: true,
  data: [
    {
      recordedAt: '2024-01-20',
      ourPrice: 23000,
      medianMarketPrice: 22500,
      sampleSize: 45
    },
    {
      recordedAt: '2024-01-17',
      ourPrice: 23500,
      medianMarketPrice: 22800,
      sampleSize: 42
    },
    // ... historical data
  ]
}
```

#### `GET /api/market-research/history/:vehicleId/chart`

Get formatted chart data for price trends.

**Response**:
```javascript
{
  success: true,
  data: {
    labels: ['Jan 10', 'Jan 13', 'Jan 16', 'Jan 19'],
    datasets: [
      {
        label: 'Our Price',
        data: [23500, 23500, 23000, 23000],
        borderColor: 'rgb(59, 130, 246)'
      },
      {
        label: 'Market Median',
        data: [22800, 22650, 22500, 22500],
        borderColor: 'rgb(34, 197, 94)'
      }
    ]
  }
}
```

---

### Market System Routes (`/api/market-research/system`)

**Location**: `src/routes/marketSystem.js`

#### `GET /api/market-research/system/status`

Get system status and job information.

**Response**:
```javascript
{
  success: true,
  data: {
    lastJobRun: '2024-01-20T02:00:00Z',
    nextScheduledRun: '2024-01-23T02:00:00Z',
    jobStatus: 'success',
    vehiclesAnalyzed: 45,
    apiCallsToday: 127,
    storageUsed: '2.4 GB',
    cacheHitRate: 0.73
  }
}
```

#### `POST /api/market-research/system/cleanup`

Trigger manual cleanup of old data (admin only).

**Response**:
```javascript
{
  success: true,
  data: {
    recordsDeleted: 1247,
    spaceFreed: '124 MB'
  },
  message: 'Cleanup completed successfully'
}
```

#### `GET /api/market-research/system/storage`

Get storage statistics for market research data.

---

## Frontend - Admin Dashboard

### Market Research Page

**Location**: `admin-panel/src/pages/MarketResearch.tsx`

**Features**:
1. **Overview Cards**:
   - Total vehicles with analysis
   - Active pricing alerts
   - Average price differential
   - Last analysis timestamp

2. **Alerts Section**:
   - List of overpriced/underpriced vehicles
   - Alert severity indicators (warning, critical)
   - Quick dismiss functionality
   - Filter by alert type

3. **Vehicle List Table**:
   - All inventory with market research
   - Columns: Vehicle, Our Price, Market Median, Difference, Status
   - Color coding:
     - Green: Competitive pricing
     - Yellow: Minor variance (10-15%)
     - Red: Significant variance (>15%)
   - Sort by price difference
   - Filter by pricing status

4. **Quick Actions**:
   - Analyze specific vehicle (button)
   - Update price based on market data
   - View detailed market comparison
   - Dismiss alert

5. **Vehicle Detail Modal**:
   - Full market research results
   - Top 10 comparable vehicles
   - Price distribution chart
   - Price history trend
   - Recommendation explanation

6. **Price Update Modal**:
   - Current price vs market median
   - Suggested price adjustment
   - Update price directly from modal
   - Recalculate analysis after update

**Key Components**:
- `<VehicleMarketDetail>` - Detailed comparison modal
- Alert badges with severity colors
- Price trend charts (Chart.js or Recharts)
- Real-time data refresh

---

## VIN Evaluation & Caching

### VIN Evaluation Service

**Location**: `src/services/vinEvaluationService.js`
**Route**: `/api/vin-evaluation`

**Purpose**: Quick vehicle valuation using VIN

**Process**:
1. Check cache for existing evaluation
2. If cached and not expired: Return cached data
3. If no cache:
   - Decode VIN to get vehicle details
   - Call auto.dev valuation API
   - Store result in cache
   - Set expiration (30 days)
4. Return valuation

**Cache Table**: `vin_evaluation_cache`

**Benefits**:
- Reduces API calls (cost savings)
- Faster response times
- Consistent data for repeated queries

---

## Configuration

### Environment Variables

```env
# auto.dev API
AUTODEV_API_KEY=your_api_key
AUTODEV_API_URL=https://auto.dev/api/v1

# Market research settings
MARKET_RESEARCH_INTERVAL_DAYS=3
MILEAGE_RANGE=20000
SEARCH_RADIUS_MILES=250
LISTING_RECENCY_DAYS=90
MIN_SAMPLE_SIZE=5

# Alert thresholds
PRICE_WARNING_THRESHOLD=0.10    # 10%
PRICE_CRITICAL_THRESHOLD=0.15   # 15%

# Data retention
MARKET_DATA_RETENTION_DAYS=90
PRICE_HISTORY_RETENTION_DAYS=180
CACHE_EXPIRATION_DAYS=30
```

---

## Best Practices

### When to Run Analysis

**Automated (Job)**:
- Every 3 days for all vehicles
- Ensures fresh market data
- Catches market shifts early

**Manual (On-Demand)**:
- After price adjustment
- When adding new vehicle
- Before pricing decision
- After significant market event

### Interpreting Results

**Sample Size Matters**:
- < 5 comparables: Insufficient data
- 5-15: Limited confidence
- 15-30: Moderate confidence
- 30+: High confidence

**Price Recommendations**:
- **Competitive**: Good positioning, monitor regularly
- **High**: Consider price reduction or justify premium
- **Low**: Opportunity to raise price or quick sale pricing

**Market Volatility**:
- Large sample size variance: Volatile market
- Tight price clustering: Stable market
- Monitor trends over time

---

## Troubleshooting

### Common Issues

**No Market Data Found**:
- Rare/exotic vehicle
- Very high mileage
- Unusual configuration
- Solution: Widen search parameters or manual research

**Stale Data**:
- Job not running
- API errors
- Solution: Trigger manual analysis, check job logs

**Inaccurate Recommendations**:
- Vehicle has unique features not captured
- Regional pricing differences
- Solution: Manual price adjustment with notes

**API Rate Limits**:
- Too many requests
- Solution: Increase delay between calls, use caching

---

## Metrics & Monitoring

### Key Metrics

- Analysis success rate
- Average sample size
- Alert accuracy (prices adjusted based on alerts)
- API response times
- Cache hit rate
- Data freshness (% of vehicles analyzed in last 7 days)

### Monitoring Queries

```sql
-- Vehicles needing analysis
SELECT COUNT(*) FROM inventory
WHERE id NOT IN (
  SELECT inventory_id FROM market_research_results
  WHERE last_analyzed_at > NOW() - INTERVAL '7 days'
);

-- Active alerts summary
SELECT alert_type, COUNT(*) as count
FROM market_research_alerts
WHERE dismissed = false
GROUP BY alert_type;

-- Price accuracy over time
SELECT
  AVG(ABS(our_price - median_market_price) / median_market_price) * 100 as avg_diff_percent
FROM market_price_history
WHERE recorded_at > NOW() - INTERVAL '30 days';
```
