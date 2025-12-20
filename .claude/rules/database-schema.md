---
paths: inventory-system/server/src/models/**
---

# Database Schema - Complete Reference

This document provides the complete database schema for the JP Auto Inventory System.

## Database Technology

- **DBMS**: PostgreSQL
- **ORM**: Sequelize
- **Connection**: Managed via `src/config/database.js`
- **Migrations**: Located in `src/migrations/`

## Core Tables

### users

OAuth-authenticated admin users who manage the system.

**Table**: `users`
**Model**: `src/models/User.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | User identifier |
| email | STRING(255) | UNIQUE, NOT NULL | User email address |
| name | STRING(255) | NOT NULL | Full name |
| oauth_provider | STRING(50) | NOT NULL | OAuth provider (google, microsoft) |
| oauth_id | STRING(255) | NOT NULL | Provider user ID |
| role | STRING(20) | DEFAULT 'viewer' | Access level (admin, manager, viewer) |
| avatar_url | TEXT | | Profile picture URL |
| last_login | DATE | | Last login timestamp |
| is_active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | | Creation timestamp |

**Associations**:
- `hasMany` PendingSubmission (reviewedBy)
- `hasMany` Inventory (createdBy, updatedBy)

---

### pending_submissions

Customer vehicle submissions awaiting approval.

**Table**: `pending_submissions`
**Model**: `src/models/PendingSubmission.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Submission identifier |
| submission_status | STRING(20) | DEFAULT 'pending' | Status (pending, approved, rejected) |
| submitted_at | TIMESTAMP | DEFAULT NOW | Submission timestamp |
| reviewed_at | TIMESTAMP | | Review timestamp |
| reviewed_by | UUID | FK → users.id | Reviewer user ID |
| rejection_reason | TEXT | | Reason for rejection |
| customer_name | STRING(255) | | Customer full name |
| customer_email | STRING(255) | | Customer email |
| customer_phone | STRING(50) | | Customer phone number |
| year | INTEGER | NOT NULL | Vehicle year |
| make | STRING(100) | NOT NULL | Vehicle make |
| model | STRING(100) | NOT NULL | Vehicle model |
| trim | STRING(100) | | Vehicle trim level |
| vin | STRING(17) | UNIQUE | Vehicle VIN |
| mileage | INTEGER | | Current mileage |
| asking_price | DECIMAL(10,2) | | Customer asking price |
| exterior_color | STRING(100) | | Exterior color |
| interior_color | STRING(100) | | Interior color |
| transmission | STRING(50) | | Transmission type |
| fuel_type | STRING(50) | | Fuel type |
| condition | STRING(50) | | Vehicle condition |
| images | JSONB | | Array of image URLs |
| additional_notes | TEXT | | Customer notes |
| created_at | TIMESTAMP | | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Associations**:
- `belongsTo` User (reviewedBy)
- `hasOne` Inventory (sourceSubmissionId)

---

### inventory

Active vehicles for sale in inventory.

**Table**: `inventory`
**Model**: `src/models/Inventory.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Inventory item identifier |
| status | STRING(20) | DEFAULT 'available' | Status (available, sold, pending, hold) |
| featured | BOOLEAN | DEFAULT false | Featured on homepage |
| year | INTEGER | NOT NULL | Vehicle year |
| make | STRING(100) | NOT NULL | Vehicle make |
| model | STRING(100) | NOT NULL | Vehicle model |
| trim | STRING(100) | | Vehicle trim level |
| vin | STRING(17) | UNIQUE, NOT NULL | Vehicle VIN |
| stock_number | STRING(50) | UNIQUE | Dealership stock number |
| price | DECIMAL(10,2) | NOT NULL | Selling price |
| cost | DECIMAL(10,2) | | Dealer cost |
| msrp | DECIMAL(10,2) | | Manufacturer suggested retail price |
| mileage | INTEGER | NOT NULL | Current mileage |
| exterior_color | STRING(100) | | Exterior color |
| interior_color | STRING(100) | | Interior color |
| transmission | STRING(50) | | Transmission type |
| engine | STRING(100) | | Engine description |
| fuel_type | STRING(50) | | Fuel type |
| drivetrain | STRING(50) | | Drivetrain (FWD, RWD, AWD, 4WD) |
| body_style | STRING(50) | | Body style (sedan, SUV, truck, etc) |
| doors | INTEGER | | Number of doors |
| mpg_city | INTEGER | | City MPG |
| mpg_highway | INTEGER | | Highway MPG |
| description | TEXT | | Marketing description |
| features | JSONB | | Array of vehicle features |
| images | JSONB | | Array of image URLs |
| thumbnail | STRING(500) | | Primary thumbnail URL |
| condition | STRING(50) | | Vehicle condition |
| title_status | STRING(50) | | Title status (clean, salvage, rebuilt) |
| owners | INTEGER | | Number of previous owners |
| accidents | INTEGER | | Number of reported accidents |
| service_records | BOOLEAN | | Service records available |
| warranty | TEXT | | Warranty information |
| carfax_url | STRING(500) | | Carfax report URL |
| autocheck_url | STRING(500) | | AutoCheck report URL |
| source_submission_id | UUID | FK → pending_submissions.id | Source submission if applicable |
| created_by | UUID | FK → users.id | User who created entry |
| updated_by | UUID | FK → users.id | User who last updated |
| listed_at | TIMESTAMP | | Date listed for sale |
| sold_at | TIMESTAMP | | Date sold |
| created_at | TIMESTAMP | | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Associations**:
- `belongsTo` PendingSubmission (sourceSubmissionId)
- `belongsTo` User (createdBy, updatedBy)

---

## Market Research Tables

### market_research_results

Market analysis results for inventory vehicles.

**Table**: `market_research_results`
**Created by**: Migration `1764925830845-create-market-research-tables.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Result identifier |
| inventory_id | UUID | FK → inventory.id, UNIQUE | Related inventory vehicle |
| median_price | DECIMAL(10,2) | | Median market price |
| min_price | DECIMAL(10,2) | | Minimum market price |
| max_price | DECIMAL(10,2) | | Maximum market price |
| sample_size | INTEGER | | Number of comparable vehicles |
| comparable_vehicles | JSONB | | Array of comparable listings |
| price_recommendation | STRING(50) | | Pricing recommendation |
| last_analyzed_at | TIMESTAMP | | Last analysis timestamp |
| data_source | STRING(100) | | Data source (auto.dev) |
| search_parameters | JSONB | | Search criteria used |
| created_at | TIMESTAMP | | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

---

### market_price_history

Historical price tracking for market analysis.

**Table**: `market_price_history`
**Created by**: Migration `1764925830845-create-market-research-tables.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | History entry identifier |
| inventory_id | UUID | FK → inventory.id | Related inventory vehicle |
| our_price | DECIMAL(10,2) | NOT NULL | Our listing price at time |
| median_market_price | DECIMAL(10,2) | | Market median price at time |
| min_market_price | DECIMAL(10,2) | | Market minimum price |
| sample_size | INTEGER | | Number of comparables |
| recorded_at | TIMESTAMP | DEFAULT NOW | Recording timestamp |

**Indexes**:
- `inventory_id, recorded_at` (for time-series queries)

---

### vin_evaluation_cache

Cached VIN evaluation results to reduce API calls.

**Table**: `vin_evaluation_cache`
**Created by**: Migration `1765200000000-create-vin-evaluation-cache.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Cache entry identifier |
| vin | STRING(17) | UNIQUE, NOT NULL | Vehicle VIN |
| evaluation_data | JSONB | | Cached evaluation response |
| source | STRING(50) | | Data source (auto.dev) |
| cached_at | TIMESTAMP | DEFAULT NOW | Cache timestamp |
| expires_at | TIMESTAMP | | Cache expiration |

**Indexes**:
- `vin` (for quick lookups)
- `expires_at` (for cleanup queries)

---

## Competitor Tracking Tables

### competitors

Competitor dealerships being tracked.

**Table**: `competitors`
**Model**: `src/models/Competitor.js`
**Created by**: Migration `1765300000000-create-competitor-tracking-tables.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Competitor identifier |
| name | STRING(255) | NOT NULL | Competitor business name |
| website_url | STRING(500) | | Main website URL |
| inventory_url | STRING(500) | NOT NULL | Inventory page URL |
| platform_type | STRING(50) | | Platform type (DealerOn, etc) |
| scraper_config | JSONB | | Custom scraper configuration |
| use_playwright | BOOLEAN | DEFAULT false | Use headless browser |
| active | BOOLEAN | DEFAULT true | Actively tracking |
| last_scraped_at | TIMESTAMP | | Last scrape attempt |
| last_successful_scrape_at | TIMESTAMP | | Last successful scrape |
| scrape_error | TEXT | | Last error message |
| scrape_error_type | STRING(50) | | Error category |
| created_at | TIMESTAMP | | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Associations**:
- `hasMany` CompetitorInventory
- `hasMany` CompetitorMetrics

---

### competitor_inventory

Scraped inventory listings from competitors.

**Table**: `competitor_inventory`
**Model**: `src/models/CompetitorInventory.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Inventory item identifier |
| competitor_id | UUID | FK → competitors.id, NOT NULL | Competitor reference |
| external_id | STRING(255) | | Competitor's ID for vehicle |
| vin | STRING(17) | | Vehicle VIN (if available) |
| stock_number | STRING(100) | | Competitor's stock number |
| year | INTEGER | | Vehicle year |
| make | STRING(100) | | Vehicle make |
| model | STRING(100) | | Vehicle model |
| trim | STRING(100) | | Vehicle trim |
| price | DECIMAL(10,2) | | Current listing price |
| mileage | INTEGER | | Current mileage |
| exterior_color | STRING(100) | | Exterior color |
| transmission | STRING(50) | | Transmission type |
| fuel_type | STRING(50) | | Fuel type |
| body_style | STRING(50) | | Body style |
| url | STRING(500) | | Link to listing |
| image_url | STRING(500) | | Primary image URL |
| first_seen_at | TIMESTAMP | | First time scraped |
| last_seen_at | TIMESTAMP | | Last time seen online |
| is_sold | BOOLEAN | DEFAULT false | Marked as sold |
| sold_at | TIMESTAMP | | Estimated sold date |
| days_on_market | INTEGER | | Calculated days listed |
| raw_data | JSONB | | Original scraped data |
| created_at | TIMESTAMP | | Creation timestamp |
| updated_at | TIMESTAMP | | Last update timestamp |

**Associations**:
- `belongsTo` Competitor
- `hasMany` CompetitorPriceHistory

**Indexes**:
- `competitor_id, vin`
- `competitor_id, is_sold`

---

### competitor_price_history

Price change tracking for competitor vehicles.

**Table**: `competitor_price_history`
**Model**: `src/models/CompetitorPriceHistory.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | History entry identifier |
| competitor_inventory_id | UUID | FK → competitor_inventory.id | Related vehicle |
| price | DECIMAL(10,2) | NOT NULL | Price at this point |
| min_price | DECIMAL(10,2) | | Minimum price seen |
| mileage | INTEGER | | Mileage at this point |
| recorded_at | TIMESTAMP | DEFAULT NOW | Recording timestamp |

**Associations**:
- `belongsTo` CompetitorInventory

**Indexes**:
- `competitor_inventory_id, recorded_at`

---

### competitor_metrics

Aggregated metrics for competitor performance.

**Table**: `competitor_metrics`
**Model**: `src/models/CompetitorMetrics.js`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Metrics entry identifier |
| competitor_id | UUID | FK → competitors.id, NOT NULL | Competitor reference |
| total_inventory | INTEGER | DEFAULT 0 | Total active listings |
| avg_price | DECIMAL(10,2) | | Average listing price |
| avg_days_on_market | DECIMAL(5,2) | | Average days listed |
| vehicles_sold_30d | INTEGER | DEFAULT 0 | Sales in last 30 days |
| price_changes_30d | INTEGER | DEFAULT 0 | Price changes in 30 days |
| new_listings_30d | INTEGER | DEFAULT 0 | New listings in 30 days |
| calculated_at | TIMESTAMP | DEFAULT NOW | Calculation timestamp |

**Associations**:
- `belongsTo` Competitor

**Indexes**:
- `competitor_id, calculated_at`

---

## System Tables

### export_logs

Tracking of exports to various platforms.

**Table**: `export_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Log entry identifier |
| platform | STRING | Platform name (jekyll, autotrader, etc) |
| vehicle_count | INTEGER | Number of vehicles exported |
| status | STRING | Status (success, failure) |
| error_message | TEXT | Error details if failed |
| exported_at | TIMESTAMP | Export timestamp |

---

### activity_logs

Complete audit trail of user actions.

**Table**: `activity_logs`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Log entry identifier |
| user_id | UUID | User who performed action |
| action | STRING | Action type |
| resource_type | STRING | Resource affected |
| resource_id | UUID | Resource identifier |
| changes | JSONB | Change details |
| ip_address | STRING | User IP address |
| user_agent | TEXT | User browser/client |
| created_at | TIMESTAMP | Action timestamp |

---

### storage_alerts

Storage monitoring alerts for R2 usage.

**Table**: `storage_alerts`
**Created by**: Migration `1765000000000-add-alert-dismiss-and-job-history.js`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Alert identifier |
| alert_type | STRING | Alert type (storage_limit, etc) |
| severity | STRING | Severity level (warning, critical) |
| message | TEXT | Alert message |
| metadata | JSONB | Additional alert data |
| dismissed | BOOLEAN | User dismissed |
| dismissed_at | TIMESTAMP | Dismiss timestamp |
| created_at | TIMESTAMP | Alert creation time |

---

### job_history

Scheduled job execution history.

**Table**: `job_history`
**Created by**: Migration `1765000000000-add-alert-dismiss-and-job-history.js`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | History entry identifier |
| job_name | STRING | Job identifier |
| status | STRING | Execution status (success, failure) |
| started_at | TIMESTAMP | Start timestamp |
| completed_at | TIMESTAMP | Completion timestamp |
| duration_ms | INTEGER | Duration in milliseconds |
| result | JSONB | Job result data |
| error | TEXT | Error message if failed |

---

### session

Express session store managed by connect-pg-simple.

**Table**: `session`
**Managed by**: `connect-pg-simple` package

| Column | Type | Description |
|--------|------|-------------|
| sid | STRING | Session ID (PK) |
| sess | JSONB | Session data |
| expire | TIMESTAMP | Expiration timestamp |

---

## Model Associations Summary

```
User
├── hasMany → PendingSubmission (reviewedBy)
└── hasMany → Inventory (createdBy, updatedBy)

PendingSubmission
├── belongsTo → User (reviewedBy)
└── hasOne → Inventory (sourceSubmissionId)

Inventory
├── belongsTo → PendingSubmission (sourceSubmissionId)
└── belongsTo → User (createdBy, updatedBy)

Competitor
├── hasMany → CompetitorInventory
└── hasMany → CompetitorMetrics

CompetitorInventory
├── belongsTo → Competitor
└── hasMany → CompetitorPriceHistory

CompetitorPriceHistory
└── belongsTo → CompetitorInventory

CompetitorMetrics
└── belongsTo → Competitor
```
