# JP Auto Inventory System - API Documentation

Complete REST API reference for the inventory management system.

**Base URL:** `https://inventory.jpautomotivegroup.com`
**API Version:** 1.0.0

## Authentication

All protected endpoints require OAuth authentication via Google or Microsoft. The API uses session-based authentication with cookies.

### Authentication Endpoints

#### Initiate Google OAuth
```
GET /auth/google
```
Redirects to Google OAuth consent screen.

#### Google OAuth Callback
```
GET /auth/google/callback
```
Handles Google OAuth response and creates/updates user session.

#### Initiate Microsoft OAuth
```
GET /auth/microsoft
```
Redirects to Microsoft OAuth consent screen.

#### Microsoft OAuth Callback
```
GET /auth/microsoft/callback
```
Handles Microsoft OAuth response.

#### Get Auth Status
```
GET /auth/status
```
Returns current authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "avatarUrl": "https://..."
  }
}
```

#### Logout
```
POST /auth/logout
```
Destroys user session.

---

## Submissions

Public endpoints for customer vehicle submissions.

### Create Submission (Public)
```
POST /api/submissions
```

**Rate Limit:** 5 requests per hour per IP

**Request Body:**
```json
{
  "year": 2020,
  "make": "Honda",
  "model": "Accord",
  "trim": "Sport",
  "vin": "1HGCV1F30LA000001",
  "mileage": 32000,
  "askingPrice": 22995,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "(555) 123-4567",
  "exteriorColor": "Blue",
  "interiorColor": "Black",
  "transmission": "Automatic",
  "engine": "2.0L Turbo",
  "fuelType": "Gasoline",
  "drivetrain": "FWD",
  "bodyType": "Sedan",
  "doors": 4,
  "titleStatus": "Clean",
  "conditionRating": 4,
  "conditionNotes": "Excellent condition",
  "accidentHistory": "None",
  "serviceRecords": "Complete",
  "customerNotes": "Well maintained vehicle"
}
```

**Response:**
```json
{
  "message": "Submission created successfully",
  "submission": {
    "id": "uuid",
    "year": 2020,
    "make": "Honda",
    "model": "Accord",
    "submittedAt": "2025-11-19T..."
  }
}
```

### Upload Submission Images (Public)
```
POST /api/submissions/:id/images
```

**Rate Limit:** 5 requests per hour per IP

**Request:** multipart/form-data
- Field name: `images`
- Max files: 40
- Max size per file: 10MB
- Allowed types: JPEG, PNG, WebP

**Response:**
```json
{
  "message": "Images uploaded successfully",
  "imageCount": 25,
  "images": [
    "https://r2.../vehicle-1.jpg",
    "https://r2.../vehicle-2.jpg"
  ]
}
```

### Get All Submissions (Protected)
```
GET /api/submissions?status=pending&page=1&limit=20
```

**Auth Required:** Yes (Manager or Admin)

**Query Parameters:**
- `status`: pending | approved | rejected | all (default: pending)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by (default: submittedAt)
- `order`: ASC | DESC (default: DESC)

**Response:**
```json
{
  "submissions": [...],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Get Submission by ID (Protected)
```
GET /api/submissions/:id
```

**Auth Required:** Yes

### Approve Submission (Protected)
```
POST /api/submissions/:id/approve
```

**Auth Required:** Yes (Manager or Admin)

**Request Body:**
```json
{
  "price": 22995,
  "stockNumber": "JP001",
  "internalNotes": "Great condition vehicle"
}
```

### Reject Submission (Protected)
```
POST /api/submissions/:id/reject
```

**Auth Required:** Yes (Manager or Admin)

**Request Body:**
```json
{
  "rejectionReason": "Price too high for market conditions"
}
```

### Delete Submission (Protected)
```
DELETE /api/submissions/:id
```

**Auth Required:** Yes (Admin only)

---

## Inventory

### Get All Inventory
```
GET /api/inventory
```

**Auth Required:** No (public can view)

**Query Parameters:**
- `status`: available | sold | pending | hold | all (default: available)
- `featured`: true | false
- `make`: Filter by make
- `model`: Filter by model
- `yearMin`: Minimum year
- `yearMax`: Maximum year
- `priceMin`: Minimum price
- `priceMax`: Maximum price
- `page`: Page number
- `limit`: Items per page
- `sortBy`: Field to sort by
- `order`: ASC | DESC

**Response:**
```json
{
  "inventory": [...],
  "pagination": {
    "total": 52,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Get Inventory by ID
```
GET /api/inventory/:id
```

**Auth Required:** No

### Get Inventory Statistics
```
GET /api/inventory/stats
```

**Auth Required:** No

**Response:**
```json
{
  "totalVehicles": 52,
  "availableVehicles": 45,
  "soldVehicles": 7,
  "featuredVehicles": 6,
  "averagePrice": "24567.89",
  "averageMileage": 45231
}
```

### Create Inventory Item (Protected)
```
POST /api/inventory
```

**Auth Required:** Yes (Manager or Admin)

**Request Body:**
```json
{
  "year": 2020,
  "make": "Honda",
  "model": "Accord",
  "trim": "Sport",
  "vin": "1HGCV1F30LA000001",
  "stockNumber": "JP001",
  "price": 22995,
  "cost": 20000,
  "msrp": 26995,
  "mileage": 32000,
  "exteriorColor": "Blue",
  "interiorColor": "Black",
  "transmission": "Automatic",
  "engine": "2.0L Turbo",
  "fuelType": "Gasoline",
  "drivetrain": "FWD",
  "bodyType": "Sedan",
  "doors": 4,
  "titleStatus": "Clean",
  "mpgCity": 30,
  "mpgHighway": 38,
  "horsepower": 192,
  "features": [
    "Bluetooth",
    "Backup Camera",
    "Apple CarPlay"
  ],
  "previousOwners": 1,
  "accidentHistory": "None",
  "serviceRecords": "Complete",
  "carfaxAvailable": true,
  "carfaxUrl": "https://...",
  "warrantyDescription": "3 Month / 3,000 Mile Powertrain",
  "description": "Excellent condition...",
  "marketingTitle": "2020 Honda Accord Sport - Low Miles!",
  "featured": true,
  "status": "available"
}
```

### Update Inventory Item (Protected)
```
PUT /api/inventory/:id
```

**Auth Required:** Yes (Manager or Admin)

**Request Body:** Same as create (all fields optional)

### Upload Inventory Images (Protected)
```
POST /api/inventory/:id/images?replace=false
```

**Auth Required:** Yes (Manager or Admin)

**Query Parameters:**
- `replace`: true | false (default: false) - Replace all images or append

**Request:** multipart/form-data

### Mark as Sold (Protected)
```
POST /api/inventory/:id/mark-sold
```

**Auth Required:** Yes (Manager or Admin)

### Toggle Featured Status (Protected)
```
POST /api/inventory/:id/toggle-featured
```

**Auth Required:** Yes (Manager or Admin)

### Delete Inventory Item (Protected)
```
DELETE /api/inventory/:id
```

**Auth Required:** Yes (Admin only)

---

## Exports

All export endpoints require Manager or Admin authentication.

### Export to Jekyll
```
POST /api/exports/jekyll?status=available&includeAll=false
```

**Auth Required:** Yes (Manager or Admin)

**Response:**
```json
{
  "message": "Jekyll export completed successfully",
  "vehicleCount": 45,
  "successCount": 45,
  "errorCount": 0,
  "results": {
    "success": [...],
    "errors": []
  }
}
```

### Export to Dealer Center
```
POST /api/exports/dealer-center?status=available
```

**Auth Required:** Yes (Manager or Admin)

**Response:** CSV file download

### Export to AutoTrader
```
POST /api/exports/autotrader?status=available
```

**Auth Required:** Yes (Manager or Admin)

**Response:** XML file download

### Export to CarGurus
```
POST /api/exports/cargurus?status=available
```

**Auth Required:** Yes (Manager or Admin)

**Response:** XML file download

### Export to Facebook Marketplace
```
POST /api/exports/facebook?status=available
```

**Auth Required:** Yes (Manager or Admin)

**Response:** CSV file download

### Get Export History
```
GET /api/exports/history
```

**Auth Required:** Yes (Manager or Admin)

**Response:**
```json
{
  "total": 52,
  "exports": {
    "jekyll": {
      "count": 45,
      "percentage": "86.5"
    },
    "dealerCenter": {
      "count": 38,
      "percentage": "73.1"
    },
    "autotrader": {
      "count": 42,
      "percentage": "80.8"
    },
    "cargurus": {
      "count": 40,
      "percentage": "76.9"
    },
    "facebook": {
      "count": 39,
      "percentage": "75.0"
    }
  }
}
```

---

## Users

All user management endpoints require Admin authentication.

### Get Current User
```
GET /api/users/me
```

**Auth Required:** Yes

**Response:**
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "admin",
  "avatarUrl": "https://...",
  "isActive": true,
  "createdAt": "2025-11-01T...",
  "lastLogin": "2025-11-19T..."
}
```

### Get All Users (Admin)
```
GET /api/users?role=admin&isActive=true&page=1&limit=20
```

**Auth Required:** Yes (Admin only)

**Query Parameters:**
- `role`: admin | manager | viewer
- `isActive`: true | false
- `page`: Page number
- `limit`: Items per page

### Get User by ID (Admin)
```
GET /api/users/:id
```

**Auth Required:** Yes (Admin only)

### Update User Role (Admin)
```
PUT /api/users/:id/role
```

**Auth Required:** Yes (Admin only)

**Request Body:**
```json
{
  "role": "manager"
}
```

### Deactivate User (Admin)
```
POST /api/users/:id/deactivate
```

**Auth Required:** Yes (Admin only)

### Activate User (Admin)
```
POST /api/users/:id/activate
```

**Auth Required:** Yes (Admin only)

### Delete User (Admin)
```
DELETE /api/users/:id
```

**Auth Required:** Yes (Admin only)

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes

- **200 OK** - Success
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input or validation error
- **401 Unauthorized** - Not authenticated
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource not found
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

---

## Rate Limiting

Public endpoints have rate limiting:

- **Submissions:** 5 requests per hour per IP
- **Submission Images:** 5 requests per hour per IP

Protected endpoints have higher limits based on authentication.

---

## File Uploads

### Image Requirements

- **Formats:** JPEG, PNG, WebP
- **Max size:** 10MB per image
- **Max count:** 40 images per submission/vehicle
- **Total upload:** 200MB max

### Image Processing

All uploaded images are automatically:
- Resized to max 2000px width
- Compressed to ~500KB
- Stored in Cloudflare R2
- Thumbnails generated at 400px width

---

## Examples

### Example: Create Submission with Images

```bash
# 1. Create submission
curl -X POST https://inventory.jpautomotivegroup.com/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2020,
    "make": "Honda",
    "model": "Accord",
    "vin": "1HGCV1F30LA000001",
    "mileage": 32000,
    "askingPrice": 22995,
    "customerName": "John Doe",
    "customerEmail": "john@example.com"
  }'

# Response: {"submission": {"id": "abc-123", ...}}

# 2. Upload images
curl -X POST https://inventory.jpautomotivegroup.com/api/submissions/abc-123/images \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "images=@photo3.jpg"
```

### Example: Export to AutoTrader

```bash
curl -X POST https://inventory.jpautomotivegroup.com/api/exports/autotrader \
  -H "Cookie: connect.sid=..." \
  --output autotrader.xml
```

---

## Webhook Integration (Future)

Future versions will support webhooks for:
- New submission notifications
- Inventory changes
- Export completions
- User actions

---

**API Documentation v1.0**
Last updated: November 2025
