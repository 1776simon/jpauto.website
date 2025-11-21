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

**Key Components**:
```
inventory-system/server/src/
├── index.js                    # Main Express server
├── config/
│   ├── database.js            # PostgreSQL connection
│   ├── passport.js            # OAuth strategies
│   └── logger.js              # Winston logger
├── models/
│   ├── User.js                # Admin users (OAuth)
│   ├── PendingSubmission.js   # Customer vehicle submissions
│   ├── Inventory.js           # Active inventory
│   └── index.js               # Model relationships
├── routes/
│   ├── auth.js                # OAuth endpoints
│   ├── submissions.js         # Submission CRUD
│   ├── inventory.js           # Inventory CRUD
│   ├── exports.js             # Export endpoints
│   └── users.js               # User management
├── services/
│   ├── r2Storage.js           # Cloudflare R2 integration
│   └── imageProcessor.js      # Sharp.js image processing
├── exports/
│   ├── jekyll/               # Website export generator
│   ├── dealer-center/        # DMS export/import
│   ├── autotrader/           # AutoTrader XML export
│   ├── cargurus/             # CarGurus XML export
│   └── facebook/             # Facebook Marketplace CSV
└── middleware/
    ├── auth.js               # Auth middleware
    ├── validation.js         # Express-validator
    └── errorHandler.js       # Error handling
```

**API Endpoints**:
- `POST /api/submissions` - Customer vehicle submissions
- `POST /api/submissions/:id/images` - Upload vehicle photos
- `GET /api/inventory` - List inventory (admin)
- `POST /api/inventory` - Add vehicle to inventory
- `GET /api/exports/jekyll` - Export vehicles to Jekyll format
- `GET /api/exports/autotrader` - Export to AutoTrader XML
- `GET /api/exports/cargurus` - Export to CarGurus XML
- `GET /api/exports/facebook` - Export to Facebook CSV
- `GET /api/exports/dealer-center` - Export to DMS

### 3. Admin Dashboard (React)
- **Location**: `inventory-system/client/`
- **Status**: Structure created, implementation pending
- **Directories**:
  - `src/components/` - React components
  - `src/pages/` - Page views
  - `src/services/` - API service layer
  - `src/utils/` - Utility functions
- **Planned Features**:
  - Login via OAuth (Google/Microsoft)
  - View pending submissions
  - Approve/reject submissions
  - Manage active inventory
  - Export to multiple platforms
  - Upload/manage vehicle photos
  - Bulk operations

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
cd inventory-system/client

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
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

**Tables**:
- `users` - OAuth-authenticated admin users
- `pending_submissions` - Customer vehicle submissions awaiting approval
- `inventory` - Active vehicles for sale
- `export_logs` - Tracking of exports to various platforms
- `activity_logs` - Complete audit trail
- `session` - Express session store

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
- **Admin Dashboard**: https://admin.jpautomotivegroup.com (Cloudflare Pages - pending deployment)

## Documentation

- **CLAUDE.md** - This file (project overview)
- **inventory-system/README.md** - Complete system documentation
- **inventory-system/OVERVIEW.md** - High-level architecture overview
- **inventory-system/DEPLOYMENT.md** - Deployment guide
- **inventory-system/API.md** - API endpoint documentation
- **consignment-form/CLOUDFLARE-PAGES-SETUP.md** - Consignment form deployment guide
- **consignment-form/RECAPTCHA-SETUP.md** - reCAPTCHA configuration guide
- **CICD_SETUP.md** - CI/CD pipeline documentation
