---
paths:
  - inventory-system/server/src/services/competitorScraper.js
  - inventory-system/server/src/services/scraperParsers.js
  - inventory-system/server/src/controllers/competitorController.js
  - inventory-system/server/src/routes/competitors.js
  - inventory-system/server/src/jobs/competitorScraperJob.js
  - admin-panel/src/pages/CompetitorTracking.tsx
---

# Competitor Tracking System

## Overview

The Competitor Tracking System monitors competing dealerships' inventory, tracks pricing changes, and provides competitive intelligence for pricing and inventory decisions.

**Key Features**:
- Automated daily scraping of competitor websites
- Price change tracking and history
- Inventory turnover metrics
- Platform-specific parsers (DealerOn, DealerInspire, etc.)
- Headless browser support (Playwright) for dynamic sites
- Sold vehicle detection
- Competitive metrics dashboard

---

## Architecture

### Data Flow

```
Competitor Website
    ↓
Competitor Scraper Job (daily at 2 AM)
    ↓
Scraping Method (Axios + Cheerio OR Playwright)
    ↓
Platform Parser (DealerOn, DealerInspire, Generic)
    ↓
Vehicle Data Extraction
    ↓
Database (competitor_inventory, price_history)
    ↓
Metrics Calculation
    ↓
Admin Dashboard
```

---

## Backend Services

### 1. competitorScraper.js

**Purpose**: Core scraping functionality for competitor inventory

**Main Function**: `scrapeCompetitor(competitor)`

**Process**:
1. Load competitor configuration from database
2. Determine scraping method:
   - **Playwright**: For JavaScript-heavy sites
   - **Axios + Cheerio**: For static HTML sites (faster)
3. Fetch inventory page
4. Pass HTML to platform-specific parser
5. Extract vehicle listings
6. For each vehicle:
   - Check if exists in database (match by VIN or external ID)
   - If new: Create record
   - If existing: Update and track changes
7. Mark unseen vehicles as potentially sold
8. Calculate metrics
9. Update competitor status

**Scraping Methods**:

#### Axios + Cheerio (Fast)
```javascript
const response = await axios.get(competitor.inventoryUrl);
const $ = cheerio.load(response.data);
const vehicles = parseVehicles($, competitor.platformType);
```

**Pros**: Fast, low resource usage
**Cons**: Can't handle JavaScript-rendered content

#### Playwright (Robust)
```javascript
const browser = await playwright.chromium.launch();
const page = await browser.newPage();
await page.goto(competitor.inventoryUrl);
await page.waitForSelector('.vehicle-card');
const html = await page.content();
const $ = cheerio.load(html);
const vehicles = parseVehicles($, competitor.platformType);
await browser.close();
```

**Pros**: Handles JavaScript, can interact with page
**Cons**: Slower, more resource-intensive

**Configuration Per Competitor**:
```javascript
{
  id: 'uuid',
  name: 'ABC Motors',
  websiteUrl: 'https://abcmotors.com',
  inventoryUrl: 'https://abcmotors.com/inventory',
  platformType: 'dealeron',  // or 'dealerinspire', 'generic'
  usePlaywright: false,      // true for dynamic sites
  scraperConfig: {
    selectors: {
      vehicleCard: '.vehicle-card',
      price: '.price',
      // ... custom selectors
    },
    pagination: {
      type: 'scroll',  // or 'button', 'url'
      maxPages: 10
    }
  },
  active: true
}
```

**Error Handling**:
- Network errors: Retry with exponential backoff (2 retries)
- Parsing errors: Log and continue with next vehicle
- Timeout: 30 seconds per page
- Store error in `scrape_error` field
- Categorize error type: 'network', 'parsing', 'timeout', 'unknown'

---

### 2. scraperParsers.js

**Purpose**: Platform-specific HTML parsing logic

**Supported Platforms**:
1. **DealerOn** - Common dealership platform
2. **DealerInspire** - Modern dealership platform
3. **Generic** - Fallback parser with configurable selectors

#### DealerOn Parser

**Function**: `parseDealerOnInventory($)`

**Selectors**:
```javascript
{
  vehicleCard: '.vehicle-card, .inventory-item',
  year: '.vehicle-year',
  make: '.vehicle-make',
  model: '.vehicle-model',
  trim: '.vehicle-trim',
  price: '.price, .vehicle-price',
  mileage: '.mileage, .vehicle-mileage',
  vin: '.vin',
  stockNumber: '.stock-number',
  url: '.vehicle-link',
  image: '.vehicle-image img'
}
```

**Data Extraction**:
- Price: Extract numbers, remove commas/currency symbols
- Mileage: Extract numbers, handle "K" notation (50K = 50000)
- Year: Parse as integer, validate range (1900-current+2)
- VIN: Uppercase, validate 17 characters
- Stock number: Trim whitespace

**Special Handling**:
- Multiple price formats: "$25,000", "25000", "25K"
- Mileage formats: "50,000 miles", "50K", "50000"
- Missing data: Skip vehicle or use null/default

#### DealerInspire Parser

**Function**: `parseDealerInspireInventory($)`

Similar to DealerOn but with platform-specific selectors:
```javascript
{
  vehicleCard: '.srp-list-item',
  year: '[data-year]',
  make: '[data-make]',
  model: '[data-model]',
  price: '.pricing-value',
  mileage: '.odometer-value',
  // ...
}
```

#### Generic Parser

**Function**: `parseGenericInventory($, config)`

**Configuration Required**:
```javascript
{
  selectors: {
    vehicleCard: '.custom-vehicle-card',
    price: '.custom-price',
    mileage: '.custom-mileage',
    // ... all required fields
  },
  dataAttributes: {
    year: 'data-year',      // use attribute instead of text
    vin: 'data-vin'
  },
  textTransforms: {
    price: (text) => parseInt(text.replace(/[^0-9]/g, '')),
    mileage: (text) => parseInt(text.replace(/[^0-9]/g, ''))
  }
}
```

**Flexibility**:
- Custom selectors per competitor
- Data attribute extraction
- Custom text transformation functions
- Fallback selectors (try multiple)

**Parser Selection**:
```javascript
const parser = {
  'dealeron': parseDealerOnInventory,
  'dealerinspire': parseDealerInspireInventory,
  'generic': ($ ) => parseGenericInventory($, competitor.scraperConfig)
}[competitor.platformType] || parseGenericInventory;

const vehicles = parser($);
```

---

### 3. Vehicle Matching & Deduplication

**Challenge**: Identify same vehicle across scrapes

**Matching Strategy** (in order of preference):
1. **VIN match** - Most reliable (if available)
2. **External ID** - Competitor's stock/inventory ID
3. **Fuzzy match** - Year + Make + Model + Mileage (within 100 miles)

**Code**:
```javascript
async function findExistingVehicle(scrapedVehicle, competitorId) {
  // Try VIN first
  if (scrapedVehicle.vin) {
    const match = await CompetitorInventory.findOne({
      where: {
        competitorId,
        vin: scrapedVehicle.vin
      }
    });
    if (match) return match;
  }

  // Try external ID
  if (scrapedVehicle.externalId) {
    const match = await CompetitorInventory.findOne({
      where: {
        competitorId,
        externalId: scrapedVehicle.externalId
      }
    });
    if (match) return match;
  }

  // Fuzzy match (year, make, model, similar mileage)
  const match = await CompetitorInventory.findOne({
    where: {
      competitorId,
      year: scrapedVehicle.year,
      make: scrapedVehicle.make,
      model: scrapedVehicle.model,
      mileage: {
        [Op.between]: [
          scrapedVehicle.mileage - 100,
          scrapedVehicle.mileage + 100
        ]
      }
    }
  });

  return match || null;
}
```

---

### 4. Price Change Tracking

**Purpose**: Monitor price adjustments over time

**Process**:
1. When updating existing vehicle:
   - Compare new price to current price
   - If different: Record in `competitor_price_history`
   - Track minimum price ever seen
2. Store price history entry:
   ```javascript
   {
     competitorInventoryId: 'uuid',
     price: 24500,
     minPrice: 23900,  // lowest price ever seen
     mileage: 45200,   // mileage at this price point
     recordedAt: '2024-01-20T02:00:00Z'
   }
   ```
3. Calculate price trend:
   - Price increased
   - Price decreased
   - Price stable

**Use Cases**:
- Identify competitor pricing strategies
- Detect clearance sales (price drops)
- Find overpriced vehicles (price increases)
- Track market trends

---

### 5. Sold Vehicle Detection

**Challenge**: Detect when competitor vehicle is sold

**Strategy**:
1. During each scrape, mark all current vehicles with `last_seen_at = NOW()`
2. After scrape, query for vehicles NOT updated:
   ```sql
   SELECT * FROM competitor_inventory
   WHERE competitor_id = ?
   AND last_seen_at < (NOW() - INTERVAL '7 days')
   AND is_sold = false
   ```
3. Mark as sold:
   ```javascript
   {
     isSold: true,
     soldAt: new Date(),
     daysOnMarket: calculateDays(firstSeenAt, soldAt)
   }
   ```
4. Use sold vehicles for metrics:
   - Average days to sell
   - Successful price points
   - Turnover rate

**Days to Sell**:
```javascript
const daysOnMarket = Math.floor(
  (soldAt - firstSeenAt) / (1000 * 60 * 60 * 24)
);
```

---

### 6. Metrics Calculation

**Purpose**: Aggregate competitor performance data

**Metrics Tracked** (in `competitor_metrics` table):

```javascript
{
  competitorId: 'uuid',
  totalInventory: 127,           // Active listings
  avgPrice: 24532.50,            // Average listing price
  avgDaysOnMarket: 32.5,         // Average time to sell
  vehiclesSold30d: 14,           // Sales last 30 days
  priceChanges30d: 23,           // Price adjustments
  newListings30d: 18,            // New inventory added
  calculatedAt: '2024-01-20T02:00:00Z'
}
```

**Calculation Queries**:

```sql
-- Total active inventory
SELECT COUNT(*) FROM competitor_inventory
WHERE competitor_id = ? AND is_sold = false;

-- Average price
SELECT AVG(price) FROM competitor_inventory
WHERE competitor_id = ? AND is_sold = false;

-- Average days on market (sold vehicles)
SELECT AVG(days_on_market) FROM competitor_inventory
WHERE competitor_id = ?
AND is_sold = true
AND sold_at > NOW() - INTERVAL '90 days';

-- Vehicles sold in last 30 days
SELECT COUNT(*) FROM competitor_inventory
WHERE competitor_id = ?
AND sold_at > NOW() - INTERVAL '30 days';

-- Price changes in last 30 days
SELECT COUNT(DISTINCT competitor_inventory_id)
FROM competitor_price_history
WHERE competitor_inventory_id IN (
  SELECT id FROM competitor_inventory WHERE competitor_id = ?
)
AND recorded_at > NOW() - INTERVAL '30 days';

-- New listings in last 30 days
SELECT COUNT(*) FROM competitor_inventory
WHERE competitor_id = ?
AND first_seen_at > NOW() - INTERVAL '30 days';
```

**Update Frequency**:
- Calculated after each scrape
- Stored for historical trending
- Displayed on admin dashboard

---

## API Routes

### Competitor Management (`/api/competitors`)

**Location**: `src/routes/competitors.js`
**Controller**: `src/controllers/competitorController.js`

#### `GET /api/competitors`

List all competitors with latest metrics.

**Response**:
```javascript
{
  success: true,
  data: [
    {
      id: 'uuid',
      name: 'ABC Motors',
      websiteUrl: 'https://abcmotors.com',
      active: true,
      lastScrapedAt: '2024-01-20T02:00:00Z',
      lastSuccessfulScrapeAt: '2024-01-20T02:00:00Z',
      scrapeError: null,
      metrics: {
        totalInventory: 127,
        avgPrice: 24532.50,
        vehiclesSold30d: 14,
        avgDaysOnMarket: 32.5
      }
    },
    // ...
  ]
}
```

#### `POST /api/competitors`

Add new competitor to track.

**Request Body**:
```javascript
{
  name: 'XYZ Auto Sales',
  websiteUrl: 'https://xyzauto.com',
  inventoryUrl: 'https://xyzauto.com/inventory',
  platformType: 'dealeron',
  usePlaywright: false,
  scraperConfig: {
    selectors: { /* ... */ }
  }
}
```

**Response**:
```javascript
{
  success: true,
  data: {
    id: 'uuid',
    name: 'XYZ Auto Sales',
    active: true,
    createdAt: '2024-01-20'
  },
  message: 'Competitor added successfully'
}
```

#### `GET /api/competitors/:id`

Get detailed competitor information.

#### `PUT /api/competitors/:id`

Update competitor configuration.

#### `DELETE /api/competitors/:id`

Delete competitor and all associated data.

#### `PATCH /api/competitors/:id/status`

Toggle competitor active/inactive status.

---

### Competitor Inventory (`/api/competitors/:id/inventory`)

#### `GET /api/competitors/:id/inventory`

Get competitor's current inventory.

**Query Parameters**:
- `status` - Filter by sold/active (`?status=active`)
- `sort` - Sort by field (`?sort=price`)
- `order` - Sort order (`?order=desc`)
- `limit` - Limit results (`?limit=50`)

**Response**:
```javascript
{
  success: true,
  data: {
    competitor: {
      id: 'uuid',
      name: 'ABC Motors'
    },
    inventory: [
      {
        id: 'uuid',
        year: 2020,
        make: 'Toyota',
        model: 'Camry',
        trim: 'SE',
        price: 24500,
        mileage: 45000,
        vin: '1HGBH41JXMN109186',
        stockNumber: 'ABC123',
        exteriorColor: 'Silver',
        url: 'https://abcmotors.com/inventory/abc123',
        imageUrl: 'https://...',
        firstSeenAt: '2024-01-10',
        lastSeenAt: '2024-01-20',
        daysOnMarket: 10,
        isSold: false,
        priceHistory: [
          { price: 25500, recordedAt: '2024-01-10' },
          { price: 24500, recordedAt: '2024-01-15' }
        ]
      },
      // ...
    ],
    summary: {
      total: 127,
      avgPrice: 24532,
      priceRange: [12900, 89500]
    }
  }
}
```

---

### Scraping Operations

#### `POST /api/competitors/:id/scrape`

Trigger manual scrape for a competitor.

**Response**:
```javascript
{
  success: true,
  data: {
    vehiclesScraped: 127,
    newVehicles: 5,
    updatedVehicles: 122,
    soldVehicles: 3,
    priceChanges: 8,
    scrapeDuration: 12500  // ms
  },
  message: 'Scrape completed successfully'
}
```

---

### Metrics & Analytics

#### `GET /api/competitors/:id/metrics`

Get historical metrics for competitor.

**Response**:
```javascript
{
  success: true,
  data: {
    current: {
      totalInventory: 127,
      avgPrice: 24532.50,
      avgDaysOnMarket: 32.5,
      vehiclesSold30d: 14
    },
    history: [
      {
        calculatedAt: '2024-01-20',
        totalInventory: 127,
        avgPrice: 24532.50
      },
      {
        calculatedAt: '2024-01-19',
        totalInventory: 125,
        avgPrice: 24621.00
      },
      // ... last 30 days
    ],
    trends: {
      inventoryChange: +2,        // +/- from last week
      priceChange: -88.50,        // avg price change
      turnoverRate: 0.11          // vehicles sold / total inventory
    }
  }
}
```

#### `GET /api/competitors/:id/price-history/:vehicleId`

Get price history for specific competitor vehicle.

---

## Frontend - Admin Dashboard

### Competitor Tracking Page

**Location**: `admin-panel/src/pages/CompetitorTracking.tsx`

**Features**:

1. **Competitor List**:
   - Card/table view of all tracked competitors
   - Status indicators (active, last scrape, errors)
   - Key metrics at a glance
   - Quick actions (scrape now, edit, delete)

2. **Add Competitor Modal**:
   - Form to add new competitor
   - Platform selection dropdown
   - Playwright toggle
   - Custom selector configuration
   - Test scrape before saving

3. **Competitor Detail Modal**:
   - Full inventory list
   - Vehicle cards with images
   - Price history charts
   - Sold vehicles tab
   - Metrics trends
   - Recent price changes

4. **Metrics Dashboard**:
   - Comparison across all competitors
   - Market positioning
   - Price competitiveness
   - Inventory turnover

5. **Alerts & Insights**:
   - Competitor price drops (sale alerts)
   - New inventory additions
   - Sold vehicle notifications
   - Market trend changes

**Key Components**:
- `<CompetitorDetailModal>` - Inventory and metrics
- `<AddCompetitorModal>` - New competitor form
- Price history charts
- Real-time scrape status

---

## Configuration

### Environment Variables

```env
# Scraping
SCRAPER_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
SCRAPER_TIMEOUT_MS=30000
SCRAPER_MAX_RETRIES=2
SCRAPER_DELAY_MS=5000

# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_VIEWPORT_WIDTH=1920
PLAYWRIGHT_VIEWPORT_HEIGHT=1080

# Detection
SOLD_DETECTION_DAYS=7
MIN_DAYS_ON_MARKET=1

# Rate limiting
SCRAPE_DELAY_BETWEEN_COMPETITORS_MS=5000
MAX_CONCURRENT_SCRAPES=1
```

---

## Best Practices

### Adding New Competitors

1. **Research platform type**:
   - View page source
   - Identify platform (DealerOn, DealerInspire, custom)
2. **Test selectors**:
   - Use browser DevTools
   - Verify selectors work
3. **Test scrape**:
   - Run manual scrape
   - Verify data extraction
4. **Configure Playwright** (if needed):
   - JavaScript-heavy sites
   - Sites with lazy loading
   - Sites blocking scrapers

### Monitoring

**Health Checks**:
- Scrape success rate
- Parse error rate
- Average scrape duration
- Data quality (missing fields)

**Alerts**:
- Scrape failures >3 consecutive times
- Parse rate <80%
- No vehicles found (site structure changed)

### Ethical Scraping

- Respect robots.txt
- Reasonable scrape frequency (daily, not hourly)
- User-Agent identification
- Rate limiting between requests
- Don't overwhelm competitor servers
- Public data only (no authenticated areas)

---

## Troubleshooting

### Common Issues

**No vehicles scraped**:
- Site structure changed → Update selectors
- Playwright needed → Enable `usePlaywright`
- Anti-scraper measures → Adjust User-Agent, add delays

**Incorrect data**:
- Parser selecting wrong elements → Refine selectors
- Data format changed → Update transformation logic

**Timeout errors**:
- Slow site → Increase timeout
- Too many vehicles → Add pagination handling
- Network issues → Retry logic

**Duplicate vehicles**:
- VIN not available → Improve fuzzy matching
- External ID changed → Use multiple match criteria

---

## Future Enhancements

- **Proxy rotation** - Avoid IP blocking
- **Image comparison** - Verify same vehicle visually
- **AI-powered parsing** - Adapt to site changes automatically
- **Real-time alerts** - Notify on competitor actions
- **Market insights** - Broader market analysis beyond direct competitors
- **Automated platform detection** - Identify platform without manual config
