# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JP AUTO is a used car dealership with a full-stack inventory management system consisting of:
1. **Public Website** - Jekyll static site for showcasing vehicles
2. **Backend API** - Node.js/Express server for inventory management
3. **Admin Dashboard** - React admin panel for managing inventory
4. **Consignment Form** - Public form for customer vehicle submissions

## Architecture

### 1. Public Website (Jekyll)
- **Framework**: Jekyll static site generator
- **Styling**: Tailwind CSS with custom theme
- **Location**: Root directory
- **Key Files**:
  - `index.html` - Homepage with Jekyll templating
  - `_layouts/` - Page templates (home.html, page.html, vehicle.html, default.html)
  - `_includes/` - Reusable components (header.html, footer.html)
  - `_vehicles/` - Vehicle markdown files (dynamically generated from inventory system)
  - `_site/` - Generated static site
- **Custom colors**: Primary orange (#ff6b35) and primary-dark (#e55a28)
- **Deployment**: GitHub Pages or static hosting

### 2. Backend Server (Node.js/Express)
- **Location**: `inventory-system/server/`
- **Framework**: Express.js
- **Database**: PostgreSQL (via Sequelize ORM)
- **Storage**: Cloudflare R2 (S3-compatible) for vehicle images
- **Authentication**: OAuth 2.0 (Google/Microsoft) via Passport.js
- **Deployment**: Railway (https://jp-auto-inventory-production.up.railway.app)

**Core Systems**:
- **Inventory Management** - Submissions, active inventory, image processing
- **Multi-Platform Exports** - Jekyll, AutoTrader, CarGurus, Facebook, DealerCenter
- **Market Research** - Automated pricing insights and competitive analysis
- **Competitor Tracking** - Web scraping, price monitoring, inventory tracking
- **VIN Services** - VIN decoding, vehicle valuation, data caching
- **Scheduled Jobs** - Automated exports, market analysis, competitor scraping
- **Admin Features** - OAuth authentication, user management, audit logging

**Key Services**:
- `services/r2Storage.js` - Cloudflare R2 image storage
- `services/imageProcessor.js` - Sharp.js image processing
- `services/autodevMarketResearch.js` - Market data via auto.dev API
- `services/competitorScraper.js` - Competitor website scraping (Playwright/Cheerio)
- `services/vinDecoder.js` - VIN decoding via NHTSA
- `services/ftpService.js` - FTP uploads for DMS exports

📖 **Detailed system documentation**: See `.claude/rules/` for subsystem details

**Core API Endpoints**:
- `/api/submissions` - Vehicle submission CRUD
- `/api/inventory` - Inventory management
- `/api/exports/*` - Multi-platform exports (Jekyll, AutoTrader, CarGurus, Facebook, DMS)
- `/api/users` - User management
- `/api/auth` - OAuth authentication

**Extended APIs**:
- `/api/market-research/*` - Market analysis and pricing insights
- `/api/competitors` - Competitor tracking and scraping
- `/api/vin*` - VIN decoding and valuation services
- `/api/migrations` - Database migration management

📖 **Complete API reference**: See @.claude/rules/backend-api.md

### 3. Admin Dashboard (React)
- **Location**: `admin-panel/`
- **Framework**: React with TypeScript (built via builder.io)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Cloudflare Pages (https://admin.jpautomotivegroup.com)
- **Status**: Production (live)
- **Key Features**:
  - Login via OAuth (Google/Microsoft)
  - Dashboard with inventory statistics
  - View and manage pending submissions
  - Approve/reject submissions
  - Manage active inventory (add, edit, delete, status changes)
  - Export to multiple platforms (Jekyll, AutoTrader, CarGurus, Facebook, DMS)
  - Market research and pricing insights
  - Competitor tracking and analysis
  - Image upload and management
  - User management
- **Main Pages**:
  - `Dashboard.tsx` - Overview and statistics
  - `Inventory.tsx` - Inventory management
  - `Submissions.tsx` - Customer submission review
  - `Export.tsx` - Platform export controls
  - `MarketResearch.tsx` - Pricing insights and market analysis
  - `CompetitorTracking.tsx` - Competitor monitoring dashboard

### 4. Public Consignment Form
- **Location**: `consignment-form/index.html`
- **Hosted at**: https://consign.jpautomotivegroup.com
- **Platform**: Cloudflare Pages (auto-deploys from GitHub)
- **Purpose**: Customer vehicle submission form
- **Features**:
  - Customer information input
  - Vehicle details (year, make, model, VIN, etc.)
  - VIN auto-fill functionality
  - Image upload (up to 40 photos)
  - Google reCAPTCHA v3 spam protection
  - Progress tracking
  - Success/error messaging
- **API**: Connects to backend at https://jp-auto-inventory-production.up.railway.app
- **Status**: Production (live)
- **Deployment**: Automatic on push to `main` branch (via Cloudflare Pages)

## Development Commands

### Website (Jekyll)
```bash
# Install dependencies (if needed)
bundle install

# Run local Jekyll server
bundle exec jekyll serve

# Build static site
bundle exec jekyll build

# Preview at http://localhost:4000
```

### Backend Server
```bash
cd inventory-system/server

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production
npm start

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Admin Dashboard
```bash
cd admin-panel

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to production
git add .
git commit -m "Update admin panel"
git push
# Cloudflare Pages auto-deploys to https://admin.jpautomotivegroup.com
```

### Consignment Form
```bash
cd consignment-form

# Run local development server
npx http-server
# Or
python -m http.server 8000

# Access at http://localhost:8000

# Deploy to production
git add .
git commit -m "Update consignment form"
git push
# Cloudflare Pages auto-deploys to https://consign.jpautomotivegroup.com
```

## Database Schema

**Core Tables**:
- `users` - OAuth-authenticated admin users
- `pending_submissions` - Customer vehicle submissions awaiting approval
- `inventory` - Active vehicles for sale
- `session` - Express session store

**Market Research Tables**:
- `market_research_results` - Market analysis data
- `market_price_history` - Historical pricing data
- `vin_evaluation_cache` - Cached VIN evaluations

**Competitor Tracking Tables**:
- `competitors` - Tracked competitor dealerships
- `competitor_inventory` - Competitor vehicle listings
- `competitor_price_history` - Price change tracking
- `competitor_metrics` - Aggregated competitor metrics

**System Tables**:
- `export_logs` - Export tracking
- `activity_logs` - Audit trail
- `storage_alerts` - Storage monitoring alerts
- `job_history` - Scheduled job execution logs

📖 **Complete schema details**: See @.claude/rules/database-schema.md

## Scheduled Jobs

**Automated Tasks** (all times in Pacific):
- **Jekyll Export** - 1:55 AM daily - Export inventory to website
- **DealerCenter Export** - 2:00 AM daily - Export to DMS via FTP
- **Competitor Scraper** - 2:00 AM daily - Scrape competitor inventory
- **Market Research** - 12:00 AM every 3 days - Analyze market pricing
- **Market Cleanup** - 3:00 AM Sundays - Delete old research data
- **Storage Monitoring** - 12:00 AM daily - Monitor R2 usage

📖 **Job details and configuration**: See @.claude/rules/scheduled-jobs.md

## Image Processing Pipeline

1. Customer uploads images (up to 40 per vehicle)
2. Server validates (max 10MB per image, 200MB total)
3. Sharp.js processes images:
   - Resize to max 2000px width
   - Compress to ~500KB
   - Generate 400px thumbnails
4. Upload to Cloudflare R2
5. Store URLs in database

## Export System Workflow

```
Master Inventory (PostgreSQL)
        ↓
    Export to:
    ├── Jekyll (Website)
    ├── Dealer Center (DMS)
    ├── AutoTrader (Advertising)
    ├── CarGurus (Advertising)
    └── Facebook Marketplace (Advertising)
```

## Environment Variables

**Required for Backend** (see `inventory-system/server/.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access key
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_PUBLIC_URL` - Public URL for R2 assets
- `GOOGLE_CLIENT_ID` - OAuth Google client ID
- `GOOGLE_CLIENT_SECRET` - OAuth Google secret
- `GOOGLE_CALLBACK_URL` - OAuth callback URL
- `ADMIN_URL` - Admin dashboard URL

## Production URLs

- **Public Website**: https://jpautomotivegroup.com (Jekyll - GitHub Pages)
- **Consignment Form**: https://consign.jpautomotivegroup.com (Cloudflare Pages)
- **Backend API**: https://jp-auto-inventory-production.up.railway.app (Railway)
- **Admin Dashboard**: https://admin.jpautomotivegroup.com (Cloudflare Pages)

## Documentation

- **CLAUDE.md** - This file (project overview)
- **inventory-system/README.md** - Complete system documentation
- **inventory-system/OVERVIEW.md** - High-level architecture overview
- **inventory-system/DEPLOYMENT.md** - Deployment guide
- **inventory-system/API.md** - API endpoint documentation
- **consignment-form/CLOUDFLARE-PAGES-SETUP.md** - Consignment form deployment guide
- **consignment-form/RECAPTCHA-SETUP.md** - reCAPTCHA configuration guide
- **CICD_SETUP.md** - CI/CD pipeline documentation