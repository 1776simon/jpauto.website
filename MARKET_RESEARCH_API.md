# Market Research API - Postman Collection

## Base URLs
- **Production Backend**: `https://jp-auto-inventory-production.up.railway.app`
- **Auto.dev API**: `https://api.auto.dev`

## Authentication
All JP Auto backend endpoints require session authentication (cookies). You'll need to:
1. First login via OAuth at: `https://admin.jpautomotivegroup.com/login`
2. Copy the session cookie from browser dev tools
3. Add to Postman: Header `Cookie: connect.sid=YOUR_SESSION_ID`

---

## JP Auto Backend Endpoints

### 1. Get Market Overview
**GET** `/api/market-research/overview`

Returns market analysis for all vehicles in inventory.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalVehicles": 11,
      "analyzedVehicles": 8,
      "belowMarket": 6,
      "competitive": 2,
      "aboveMarket": 0,
      "averagePosition": 32.5,
      "lastUpdated": "2025-12-09T08:00:35.000Z"
    },
    "vehicles": [
      {
        "id": "uuid",
        "year": 2016,
        "make": "TESLA",
        "model": "Model S",
        "trim": "70",
        "vin": "5YJSA1E11GF130328",
        "ourPrice": 14000,
        "medianMarketPrice": 18500,
        "priceDelta": -4500,
        "priceDeltaPercent": -24.32,
        "position": "below_market",
        "percentileRank": 15.5,
        "listingsFound": 42,
        "lastAnalyzed": "2025-12-09T08:00:35.000Z",
        "daysInMarket": 5
      }
    ]
  }
}
```

### 2. Get Vehicle Detail
**GET** `/api/market-research/vehicle/:vehicleId`

Get detailed market analysis for specific vehicle.

**Parameters:**
- `vehicleId` (UUID) - Vehicle ID from inventory

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicle": { /* full vehicle object */ },
    "latestSnapshot": { /* market snapshot data */ },
    "priceHistory": [ /* 30 day price history */ ],
    "platformTracking": [ /* where vehicle appears */ ],
    "alerts": [ /* recent price alerts */ ]
  }
}
```

### 3. Analyze Single Vehicle
**POST** `/api/market-research/vehicle/:vehicleId/analyze`

Trigger market analysis for one vehicle.

**Parameters:**
- `vehicleId` (UUID) - Vehicle ID

**Body:**
```json
{
  "yearRange": "±1"  // Optional: "±1", "±2", "±3", or null for exact year
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "vehicle": { /* vehicle data */ },
    "snapshot": { /* snapshot created */ },
    "metrics": { /* metrics calculated */ },
    "priceStats": {
      "median": 18500,
      "average": 19200,
      "min": 12000,
      "max": 28000
    },
    "marketListings": 42,
    "duplicates": 8
  }
}
```

### 4. Analyze All Vehicles
**POST** `/api/market-research/analyze-all`

Trigger analysis for all vehicles in inventory (runs in background).

**Response:**
```json
{
  "success": true,
  "message": "Analysis started for all vehicles"
}
```

### 5. Get Market Alerts
**GET** `/api/market-research/alerts?limit=10&severity=critical`

Get recent price alerts.

**Query Parameters:**
- `limit` (default: 50) - Max alerts to return
- `severity` - Filter: "critical", "warning", "info"
- `vehicleId` - Filter by vehicle UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "vehicle_id": "uuid",
      "type": "price_below_market",
      "severity": "info",
      "title": "Below Market Pricing",
      "message": "Vehicle priced 24% below market median",
      "year": 2016,
      "make": "TESLA",
      "model": "Model S",
      "trim": "70",
      "vin": "5YJSA1E11GF130328",
      "price": 14000,
      "created_at": "2025-12-09T08:00:35.000Z"
    }
  ]
}
```

### 6. Get Job Status
**GET** `/api/market-research/jobs/status`

Get status of scheduled jobs.

**Response:**
```json
{
  "success": true,
  "data": {
    "marketResearch": {
      "enabled": true,
      "schedule": "0 0 */3 * *",
      "isRunning": false,
      "lastRun": "2025-12-09T08:00:00.000Z",
      "lastResult": {
        "success": true,
        "vehiclesAnalyzed": 11
      }
    }
  }
}
```

### 7. Run Job Manually
**POST** `/api/market-research/jobs/:jobName/run`

Trigger scheduled job manually.

**Parameters:**
- `jobName` - "marketResearch", "marketCleanup", or "storageMonitoring"

**Response:**
```json
{
  "success": true,
  "message": "Job marketResearch started"
}
```

---

## Auto.dev API (External)

### Get Listings
**GET** `https://api.auto.dev/listings`

The actual API call our backend makes to Auto.dev.

**Headers:**
```
Authorization: Bearer YOUR_AUTODEV_API_KEY
Content-Type: application/json
```

**Query Parameters:**
```
vehicle.make=TESLA
vehicle.model=Model S
vehicle.year=2016
retailListing.miles=82350-102350
zip=95814
distance=150
limit=100
page=1
```

**Example Full URL:**
```
https://api.auto.dev/listings?vehicle.make=TESLA&vehicle.model=Model%20S&vehicle.year=2016&retailListing.miles=82350-102350&zip=95814&distance=150&limit=100&page=1
```

**Response:**
```json
{
  "data": [
    {
      "vin": "5YJSA1E11GF123456",
      "retailListing": {
        "price": 18500,
        "miles": 95000,
        "zipCode": "95814",
        "dealer": "Example Motors",
        "firstSeen": "2025-12-01",
        "lastSeen": "2025-12-09"
      },
      "vehicle": {
        "year": 2016,
        "make": "Tesla",
        "model": "Model S",
        "trim": "70"
      },
      "sources": [
        {
          "platform": "autotrader",
          "url": "https://...",
          "firstSeen": "2025-12-01"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 42
  }
}
```

---

## Mileage Range Calculation

Our backend uses these brackets for mileage searches:

| Vehicle Mileage | Search Range | Example (50k miles) |
|----------------|--------------|---------------------|
| 0-50k miles    | ±10k         | 40k - 60k          |
| 50-100k miles  | ±20k         | 30k - 70k          |
| 100k+ miles    | ±30k         | 70k - 130k         |

**Auto-expansion**: If <10 results found, expands by +10k (max 5 attempts, +50k total)

---

## Common Issues

### Why Vehicles Show "N/A"
1. **Not analyzed yet** - Run "Analyze All Vehicles" button
2. **No market listings found** - Check Auto.dev for that make/model/year
3. **API key issue** - Verify AUTODEV_API_KEY is set
4. **Rate limiting** - Auto.dev API limits (check logs)

### Testing Tips
1. Use browser dev tools to copy session cookie
2. Check Railway logs for Auto.dev API responses
3. Start with `/api/market-research/overview` to verify auth
4. Use `/api/market-research/vehicle/:id/analyze` to test single vehicle

---

## Environment Variables

Required on Railway:
```env
AUTODEV_API_KEY=your_key_here
AUTODEV_API_URL=https://api.auto.dev
MARKET_RESEARCH_ZIP_CODE=95814
MARKET_RESEARCH_RADIUS=150
```
