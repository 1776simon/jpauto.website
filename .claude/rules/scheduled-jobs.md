---
paths: inventory-system/server/src/jobs/**
---

# Scheduled Jobs - Complete Reference

This document details all scheduled jobs (cron jobs) running in the JP Auto Inventory System.

## Job Manager

**Location**: `src/jobs/jobManager.js`
**Purpose**: Centralized control for all scheduled jobs

### Available Methods

- `startAll()` - Start all registered jobs
- `stopAll()` - Stop all jobs gracefully
- `getStatus()` - Get status of all jobs
- `runJob(jobName)` - Manually trigger a specific job

### Registered Jobs

```javascript
{
  marketResearch: marketResearchJob,
  marketCleanup: marketCleanupJob,
  storageMonitoring: storageMonitoringJob,
  competitorScraper: competitorScraperJob
}
```

Plus export jobs registered separately in `src/index.js`:
- Jekyll Export
- DealerCenter Export

---

## Export Jobs

### 1. Jekyll Export Job

**File**: `src/jobs/jekyllExport.js`
**Schedule**: `55 1 * * *` (1:55 AM daily, Pacific Time)
**Purpose**: Export inventory to Jekyll markdown files for public website

**Process**:
1. Query all active inventory vehicles (status = 'available')
2. For each vehicle:
   - Generate markdown file with YAML frontmatter
   - Include all vehicle details (year, make, model, VIN, price, etc.)
   - Add image URLs and features
   - Calculate display values (formatted price, MPG combined)
3. Write files to `../../_vehicles/` directory
4. Each file named as: `{year}-{make}-{model}-{stock_number}.md`
5. Log export results

**Success Criteria**:
- All available vehicles exported
- Valid YAML frontmatter
- Proper file naming convention

**Error Handling**:
- Logs individual vehicle export failures
- Continues processing remaining vehicles
- Reports summary: success count, error count

---

### 2. DealerCenter Export Job

**File**: `src/jobs/dealerCenterExport.js`
**Schedule**: `0 2 * * *` (2:00 AM daily, Pacific Time)
**Purpose**: Export inventory to DealerCenter DMS and upload via FTP

**Process**:
1. Query all inventory vehicles (all statuses)
2. Generate CSV in DealerCenter format:
   - Header row with column names
   - One row per vehicle
   - Special formatting for dates, prices, features
3. Save CSV to `exports/dealer-center/29007654_YYYYMMDD.csv`
4. Connect to FTP server (config from `src/config/dealerCenter.js`)
5. Upload file to FTP
6. Log export and upload results

**Success Criteria**:
- CSV generated successfully
- FTP upload completes
- File accessible on FTP server

**Error Handling**:
- CSV generation errors logged
- FTP connection errors caught
- Retry logic for FTP failures

**Configuration**:
- FTP host, port, username, password from environment variables
- Dealer ID: 29007654
- File format specified in `src/exports/dealer-center/dealerCenterExporter.js`

---

## Market Research Jobs

### 3. Market Research Job

**File**: `src/jobs/marketResearchJob.js`
**Schedule**: `0 0 */3 * *` (Every 3 days at midnight, Pacific Time)
**Purpose**: Automated market analysis for inventory pricing

**Process**:
1. Query inventory vehicles needing analysis:
   - Available vehicles
   - No recent analysis (>3 days old or never analyzed)
   - Valid year/make/model data
2. For each vehicle:
   - Call auto.dev API to find comparable vehicles
   - Search parameters:
     - Same year, make, model
     - Mileage within ±20,000 miles
     - Listed in last 90 days
     - Within 250 mile radius
   - Calculate market statistics:
     - Median price
     - Min/max prices
     - Sample size
   - Generate pricing recommendation:
     - "competitive" - within ±10% of median
     - "high" - more than 10% above median
     - "low" - more than 10% below median
   - Create alerts for overpriced/underpriced vehicles
   - Store results in `market_research_results` table
   - Save price history in `market_price_history` table
3. Log analysis summary

**Success Criteria**:
- All eligible vehicles analyzed
- Market data fetched successfully
- Pricing recommendations accurate
- Alerts created for outliers

**Error Handling**:
- API failures logged, continue with next vehicle
- Network errors retried (3 attempts)
- Invalid data skipped with warning
- Partial success allowed (some vehicles fail)

**Rate Limiting**:
- Processes 50 vehicles per run (configurable)
- 2-second delay between API calls
- Respects auto.dev API limits

---

### 4. Market Cleanup Job

**File**: `src/jobs/marketCleanupJob.js`
**Schedule**: `0 3 * * 0` (Sundays at 3:00 AM, Pacific Time)
**Purpose**: Clean up old market research data

**Process**:
1. Delete old market research results:
   - Results older than 90 days
   - For vehicles no longer in inventory
2. Delete old price history:
   - Entries older than 180 days
   - Keep at least 10 most recent per vehicle
3. Clean expired VIN evaluation cache:
   - Entries past expiration date
   - Entries for vehicles no longer in system
4. Archive important data (optional):
   - Significant price changes
   - High-value vehicle analyses
5. Update storage statistics
6. Log cleanup summary

**Success Criteria**:
- Old data removed
- Database size reduced
- Important data preserved
- Statistics updated

**Error Handling**:
- Transaction-based deletes (rollback on error)
- Logs count of records deleted
- Errors logged but don't stop cleanup

**Configuration**:
- Data retention periods configurable
- Minimum records to keep per vehicle

---

### 5. Storage Monitoring Job

**File**: `src/jobs/storageMonitoringJob.js`
**Schedule**: `0 0 * * *` (Daily at midnight, Pacific Time)
**Purpose**: Monitor Cloudflare R2 storage usage and create alerts

**Process**:
1. Connect to Cloudflare R2 via S3 API
2. List all objects in bucket
3. Calculate metrics:
   - Total storage used (GB)
   - Number of files
   - Average file size
   - Largest files
4. Check against thresholds:
   - Warning: >80% of limit
   - Critical: >95% of limit
5. Create storage alerts if needed:
   - Alert type: 'storage_limit'
   - Severity: 'warning' or 'critical'
   - Include usage statistics
6. Store metrics in database
7. Log monitoring results

**Success Criteria**:
- Storage calculated accurately
- Alerts created when needed
- Metrics stored for trending

**Error Handling**:
- R2 connection errors logged
- Calculation errors don't crash job
- Alert creation failures logged

**Alert Thresholds**:
- Warning: 80% of storage limit (configurable)
- Critical: 95% of storage limit
- Email notifications (if configured)

---

## Competitor Tracking Jobs

### 6. Competitor Scraper Job

**File**: `src/jobs/competitorScraperJob.js`
**Schedule**: `0 2 * * *` (2:00 AM daily, Pacific Time)
**Purpose**: Scrape competitor inventory and track pricing

**Process**:
1. Query all active competitors from database
2. For each competitor:
   - Load scraper configuration
   - Decide scraping method:
     - Playwright (headless browser) if `use_playwright = true`
     - Axios + Cheerio (fast HTML parsing) otherwise
   - Fetch competitor's inventory page
   - Parse vehicle listings using platform-specific parser:
     - DealerOn platform
     - DealerInspire platform
     - Generic parser (fallback)
   - Extract vehicle data:
     - Year, make, model, trim
     - Price, mileage
     - VIN (if available)
     - Stock number
     - Colors, transmission, fuel type
     - Listing URL and image
   - For each vehicle:
     - Check if already in `competitor_inventory`
     - If new: Create record, set `first_seen_at`
     - If existing: Update price, mileage, `last_seen_at`
     - Track price changes in `competitor_price_history`
   - Mark vehicles not seen as potentially sold:
     - If not seen in 7 days: `is_sold = true`, set `sold_at`
   - Calculate competitor metrics:
     - Total inventory count
     - Average price
     - Average days on market
     - Vehicles sold in last 30 days
     - Price changes in last 30 days
     - New listings in last 30 days
   - Store metrics in `competitor_metrics`
3. Update competitor status:
   - `last_scraped_at` = now
   - `last_successful_scrape_at` = now (if successful)
   - Clear `scrape_error` on success
4. Log scraping results

**Success Criteria**:
- All active competitors scraped
- New vehicles added to tracking
- Price changes recorded
- Metrics calculated accurately

**Error Handling**:
- Per-competitor error isolation (one failure doesn't stop others)
- Log error type: 'network', 'parsing', 'timeout'
- Store error message in `scrape_error` field
- Playwright browser cleanup on error
- Retry logic: 2 retries with exponential backoff

**Scraper Configuration**:
```json
{
  "platform": "dealeron",
  "selectors": {
    "vehicleCard": ".vehicle-card",
    "price": ".price",
    "mileage": ".mileage",
    "year": ".year",
    "make": ".make",
    "model": ".model"
  },
  "pagination": {
    "type": "scroll",
    "maxPages": 10
  }
}
```

**Platform Parsers**:
- `src/services/scraperParsers.js`
- Supports: DealerOn, DealerInspire, Custom

**Rate Limiting**:
- 5-second delay between competitors
- Respect robots.txt (if configured)
- User-Agent rotation (if configured)

---

## Job Scheduling

All jobs use `node-cron` package with Pacific Time timezone.

### Cron Expression Reference

```
┌────────────── second (optional, 0-59)
│ ┌──────────── minute (0-59)
│ │ ┌────────── hour (0-23)
│ │ │ ┌──────── day of month (1-31)
│ │ │ │ ┌────── month (1-12)
│ │ │ │ │ ┌──── day of week (0-7, 0 and 7 are Sunday)
│ │ │ │ │ │
* * * * * *
```

### Schedule Summary

| Job | Time (PST) | Frequency | Cron Expression |
|-----|-----------|-----------|-----------------|
| Jekyll Export | 1:55 AM | Daily | `55 1 * * *` |
| DealerCenter Export | 2:00 AM | Daily | `0 2 * * *` |
| Competitor Scraper | 2:00 AM | Daily | `0 2 * * *` |
| Market Research | 12:00 AM | Every 3 days | `0 0 */3 * *` |
| Market Cleanup | 3:00 AM | Sundays | `0 3 * * 0` |
| Storage Monitoring | 12:00 AM | Daily | `0 0 * * *` |

---

## Manual Job Execution

Jobs can be triggered manually via API endpoints (admin only):

```bash
# Trigger market research for specific vehicle
POST /api/market-research/analyze/:vehicleId

# Trigger competitor scrape for specific competitor
POST /api/competitors/:id/scrape

# Trigger system cleanup
POST /api/market-research/system/cleanup

# Trigger exports
POST /api/exports/jekyll
POST /api/exports/dealer-center/upload
```

---

## Job History & Monitoring

All job executions are logged in the `job_history` table:

```sql
SELECT
  job_name,
  status,
  started_at,
  completed_at,
  duration_ms,
  error
FROM job_history
WHERE job_name = 'marketResearch'
ORDER BY started_at DESC
LIMIT 10;
```

**Metrics Tracked**:
- Execution time
- Success/failure status
- Error messages
- Result data (vehicle count, etc.)

**Monitoring Queries**:
```sql
-- Failed jobs in last 7 days
SELECT * FROM job_history
WHERE status = 'failure'
AND started_at > NOW() - INTERVAL '7 days';

-- Average job duration
SELECT
  job_name,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(*) as executions
FROM job_history
WHERE completed_at > NOW() - INTERVAL '30 days'
GROUP BY job_name;
```

---

## Configuration

### Environment Variables

```env
# Timezone for cron jobs
TZ=America/Los_Angeles

# Job execution limits
MAX_MARKET_RESEARCH_VEHICLES=50
MARKET_RESEARCH_INTERVAL_DAYS=3
CLEANUP_RETENTION_DAYS=90

# Storage monitoring
STORAGE_WARNING_THRESHOLD=0.80
STORAGE_CRITICAL_THRESHOLD=0.95

# Competitor scraping
SCRAPER_USER_AGENT=Mozilla/5.0...
SCRAPER_TIMEOUT_MS=30000
SCRAPER_MAX_RETRIES=2
```

### Job Manager Initialization

In `src/index.js`:

```javascript
const jobManager = require('./jobs/jobManager');

// Start all jobs on server startup
jobManager.startAll();

// Graceful shutdown
process.on('SIGTERM', () => {
  jobManager.stopAll();
});
```
