---
paths: inventory-system/server/src/**
---

# Backend API - Complete Reference

This document provides detailed API endpoint documentation for the JP Auto Inventory System backend.

## Authentication Endpoints

**Base Route**: `/api/auth`
**Location**: `src/routes/auth.js`

- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth flow
- `GET /api/auth/microsoft/callback` - Microsoft OAuth callback
- `GET /api/auth/logout` - Logout user and clear session
- `GET /api/auth/me` - Get current authenticated user

## Submission Endpoints

**Base Route**: `/api/submissions`
**Location**: `src/routes/submissions.js`
**Controller**: `src/controllers/submissionsController.js`

- `POST /api/submissions` - Create new vehicle submission (public endpoint with reCAPTCHA)
- `POST /api/submissions/:id/images` - Upload vehicle photos (public, multipart/form-data)
- `GET /api/submissions` - List all submissions (admin, supports filtering by status)
- `GET /api/submissions/:id` - Get single submission details (admin)
- `PUT /api/submissions/:id` - Update submission (admin)
- `DELETE /api/submissions/:id` - Delete submission (admin)
- `POST /api/submissions/:id/approve` - Approve submission and move to inventory (manager/admin)
- `POST /api/submissions/:id/reject` - Reject submission with notes (manager/admin)

## Inventory Endpoints

**Base Route**: `/api/inventory`
**Location**: `src/routes/inventory.js`
**Controller**: `src/controllers/inventoryController.js`

- `GET /api/inventory` - List all inventory vehicles (admin, supports filtering by status/type)
- `GET /api/inventory/:id` - Get single vehicle details (admin)
- `POST /api/inventory` - Add vehicle to inventory (manager/admin)
- `PUT /api/inventory/:id` - Update vehicle details (manager/admin)
- `DELETE /api/inventory/:id` - Delete vehicle from inventory (admin only)
- `PATCH /api/inventory/:id/status` - Change vehicle status (available/sold/pending)
- `POST /api/inventory/:id/images` - Upload additional images (manager/admin)
- `DELETE /api/inventory/:id/images/:imageUrl` - Remove specific image (manager/admin)

## Export Endpoints

**Base Route**: `/api/exports`
**Location**: `src/routes/exports.js`
**Controller**: `src/controllers/exportsController.js`

### Platform Exports

- `GET /api/exports/jekyll` - Export to Jekyll format (public for automated sync)
- `POST /api/exports/jekyll` - Manual Jekyll export (manager/admin)
- `POST /api/exports/autotrader` - Export to AutoTrader XML (manager/admin)
- `POST /api/exports/cargurus` - Export to CarGurus XML (manager/admin)
- `POST /api/exports/facebook` - Export to Facebook Marketplace CSV (manager/admin)
- `POST /api/exports/dealer-center` - Export to DealerCenter DMS format (manager/admin)
- `POST /api/exports/dealer-center/upload` - Export and upload to DealerCenter FTP (manager/admin)

### Export History

- `GET /api/exports/history` - Get export history log (admin)

## User Management Endpoints

**Base Route**: `/api/users`
**Location**: `src/routes/users.js`
**Controller**: `src/controllers/usersController.js`

- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user details (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## VIN Services Endpoints

**Base Route**: `/api/vin`
**Location**: `src/routes/vin.js`

- `GET /api/vin/decode/:vin` - Decode VIN and get vehicle details (NHTSA API)
- `GET /api/vin/fuel-economy/:year/:make/:model` - Get EPA fuel economy data

**Base Route**: `/api/vin-evaluation`
**Location**: `src/routes/vinEvaluation.js`

- `POST /api/vin-evaluation` - Evaluate vehicle value using auto.dev
- `GET /api/vin-evaluation/cache/:vin` - Get cached evaluation result

## Market Research Endpoints

**Base Route**: `/api/market-research`
**Location**: `src/routes/marketResearch.js`

- `GET /api/market-research` - Get market research overview with alerts
- `GET /api/market-research/:vehicleId` - Get market research for specific vehicle
- `POST /api/market-research/analyze/:vehicleId` - Trigger market analysis for vehicle
- `DELETE /api/market-research/:vehicleId` - Delete market research data
- `POST /api/market-research/alerts/:alertId/dismiss` - Dismiss pricing alert

**Base Route**: `/api/market-research/history`
**Location**: `src/routes/marketHistory.js`

- `GET /api/market-research/history/:vehicleId` - Get price history for vehicle
- `GET /api/market-research/history/:vehicleId/chart` - Get chart data for price trends

**Base Route**: `/api/market-research/system`
**Location**: `src/routes/marketSystem.js`

- `GET /api/market-research/system/status` - Get system status and job info
- `POST /api/market-research/system/cleanup` - Trigger cleanup job
- `GET /api/market-research/system/storage` - Get storage statistics

## Competitor Tracking Endpoints

**Base Route**: `/api/competitors`
**Location**: `src/routes/competitors.js`
**Controller**: `src/controllers/competitorController.js`

### Competitor Management

- `GET /api/competitors` - List all competitors with metrics
- `POST /api/competitors` - Add new competitor
- `GET /api/competitors/:id` - Get competitor details
- `PUT /api/competitors/:id` - Update competitor
- `DELETE /api/competitors/:id` - Delete competitor
- `PATCH /api/competitors/:id/status` - Toggle competitor active status

### Competitor Inventory & Scraping

- `GET /api/competitors/:id/inventory` - Get competitor's inventory
- `POST /api/competitors/:id/scrape` - Trigger manual scrape for competitor
- `GET /api/competitors/:id/metrics` - Get competitor metrics and trends
- `GET /api/competitors/:id/price-history/:vehicleId` - Get price history for competitor vehicle

## Migration Management Endpoints

**Base Route**: `/api/migrations`
**Location**: `src/routes/migrations.js`

- `GET /api/migrations/status` - Get migration status
- `POST /api/migrations/run` - Run pending migrations (admin only)

## Image Verification Endpoints

**Base Route**: `/api/image-verification` (internal use)
**Location**: `src/controllers/imageVerificationController.js`

Used internally during submission/upload process to verify images are valid vehicle photos.

## Middleware & Authentication

### Auth Middleware
**Location**: `src/middleware/auth.js`

- `isAuthenticated` - Verify user is logged in
- `isManagerOrAdmin` - Verify user has manager or admin role
- `isAdmin` - Verify user has admin role only

### Validation Middleware
**Location**: `src/middleware/validation.js`

Express-validator rules for request validation on all POST/PUT endpoints.

### Upload Middleware
**Location**: `src/middleware/upload.js`

Multer configuration for multipart file uploads (images).

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": {...}
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```
