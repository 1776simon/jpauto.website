# JP Auto Inventory System - Testing Guide

Quick guide to set up and test the API locally.

## Step 1: Install Dependencies

```bash
cd inventory-system/server
npm install
```

✅ **Done!** Dependencies installed.

---

## Step 2: Setup Database

You have two options for testing:

### Option A: PostgreSQL (Recommended for Production-like Testing)

1. **Install PostgreSQL** (if not already installed)
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Create Database**
   ```bash
   # Start PostgreSQL service (if not running)
   # Windows: Check Services app
   # Mac: brew services start postgresql
   # Linux: sudo service postgresql start

   # Create database
   createdb jp_auto_inventory

   # Or using psql:
   psql -U postgres
   CREATE DATABASE jp_auto_inventory;
   \q
   ```

3. **Update .env**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/jp_auto_inventory
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=jp_auto_inventory
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### Option B: Quick Test with SQLite (For Local Testing Only)

For quick testing without PostgreSQL setup:

1. **Install SQLite dependency**
   ```bash
   npm install sqlite3
   ```

2. **Update .env**
   ```env
   DATABASE_URL=sqlite:./test_database.sqlite
   ```

3. **Modify database config temporarily**

   Edit `src/config/database.js` and change dialect to `sqlite` for testing.

---

## Step 3: Setup Google OAuth Credentials

This is required to test authentication.

### 3.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select existing project
3. Name it: **"JP Auto Inventory"**
4. Click **Create**

### 3.2 Enable Google+ API

1. In left sidebar, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click **Enable**

### 3.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (for testing) or **Internal** (if using Google Workspace)
3. Click **Create**
4. Fill in:
   - **App name:** JP Auto Inventory
   - **User support email:** your-email@jpautomotivegroup.com
   - **Developer contact:** your-email@jpautomotivegroup.com
5. Click **Save and Continue**
6. **Scopes:** Skip for now (click Save and Continue)
7. **Test users:** Add your Google email (for testing)
8. Click **Save and Continue**

### 3.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: **JP Auto Inventory - Dev**
5. **Authorized redirect URIs:** Add:
   ```
   http://localhost:5000/auth/google/callback
   ```
6. Click **Create**
7. **IMPORTANT:** Copy the **Client ID** and **Client Secret**

### 3.5 Update .env with OAuth Credentials

Open `inventory-system/server/.env` and update:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

---

## Step 4: Configure Environment Variables

Edit `inventory-system/server/.env`:

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# Session Secret (generate random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Google OAuth (from Step 3)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# For testing, you can skip these:
# Microsoft OAuth (optional)
# Cloudflare R2 (optional for now - file uploads will fail)
# ENABLE_VIRUS_SCAN=false (already false by default)
```

### Generate Session Secret

Run this command to generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `SESSION_SECRET` in `.env`.

---

## Step 5: Start the Server

```bash
cd inventory-system/server
npm run dev
```

You should see:

```
==================================================
✅ JP Auto Inventory System Server
🚀 Server running on port 5000
📍 API URL: http://localhost:5000
🌍 Environment: development
==================================================
```

If you see database errors, the database hasn't been created yet - that's okay, we'll fix it!

---

## Step 6: Test the API

### 6.1 Test Health Check

Open your browser or use curl:

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-19T..."
}
```

If database shows "disconnected", check your database credentials in `.env`.

### 6.2 Test Root Endpoint

```bash
curl http://localhost:5000/
```

**Expected Response:**
```json
{
  "message": "JP Auto Inventory Management System API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "auth": "/auth",
    "submissions": "/api/submissions",
    "inventory": "/api/inventory",
    "exports": "/api/exports",
    "users": "/api/users"
  }
}
```

### 6.3 Test OAuth Login

1. Open browser and go to:
   ```
   http://localhost:5000/auth/google
   ```

2. You should be redirected to Google login
3. Sign in with your Google account (the one you added as test user)
4. Authorize the application
5. You'll be redirected to `http://localhost:3000/dashboard`
   (This will fail because frontend doesn't exist yet - that's expected!)

6. **Check if user was created:**
   ```bash
   # If using PostgreSQL:
   psql jp_auto_inventory -c "SELECT * FROM users;"
   ```

You should see your user record!

### 6.4 Test Auth Status

```bash
# This requires cookies from OAuth login
# Use browser instead:
```

Open: `http://localhost:5000/auth/status`

If you just logged in, you should see:
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "name": "Your Name",
    "email": "your-email@gmail.com",
    "role": "viewer"
  }
}
```

---

## Step 7: Make Yourself Admin

Since you're the first user, you need admin rights:

### If using PostgreSQL:
```bash
psql jp_auto_inventory

UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';

\q
```

### If using SQLite:
```bash
sqlite3 test_database.sqlite

UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';

.quit
```

---

## Step 8: Test Protected Endpoints

Now that you're an admin, test protected endpoints:

### Get Inventory (Public)
```bash
curl http://localhost:5000/api/inventory
```

**Expected:** Empty array (no vehicles yet)

### Get Inventory Stats
```bash
curl http://localhost:5000/api/inventory/stats
```

**Expected:**
```json
{
  "totalVehicles": 0,
  "availableVehicles": 0,
  "soldVehicles": 0,
  "featuredVehicles": 0,
  "averagePrice": "0.00",
  "averageMileage": 0
}
```

---

## Step 9: Create Test Vehicle (Using Browser)

Since we need authentication, we'll use a tool like **Thunder Client** (VS Code extension) or **Postman**.

### Install Thunder Client (VS Code)

1. Open VS Code
2. Go to Extensions
3. Search **"Thunder Client"**
4. Install

### Create Test Vehicle

1. Open Thunder Client
2. Click **New Request**
3. Method: **POST**
4. URL: `http://localhost:5000/api/inventory`
5. Click **Headers** tab
6. Add header:
   - Key: `Content-Type`
   - Value: `application/json`
7. Click **Body** tab, select **JSON**
8. Paste:

```json
{
  "year": 2020,
  "make": "Honda",
  "model": "Accord",
  "trim": "Sport",
  "vin": "1HGCV1F30LA000001",
  "stockNumber": "TEST001",
  "price": 22995,
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
  "description": "Beautiful 2020 Honda Accord Sport in excellent condition!",
  "featured": true,
  "status": "available"
}
```

9. **Important:** You need to be logged in via browser first!
   - Go to `http://localhost:5000/auth/google` in browser
   - Login
   - Then try the API request

10. Click **Send**

**Expected Response:**
```json
{
  "message": "Vehicle added to inventory",
  "vehicle": { ... }
}
```

---

## Step 10: Test Exports

### Export to Jekyll

**POST** `http://localhost:5000/api/exports/jekyll`

This will create markdown files in the `_vehicles` directory!

### View Export History

**GET** `http://localhost:5000/api/exports/history`

---

## Common Issues

### Issue: "database connection failed"
**Solution:** Check PostgreSQL is running and credentials in `.env` are correct.

### Issue: "OAuth error"
**Solution:**
- Verify redirect URI matches exactly in Google Console
- Make sure test user is added in Google Console
- Clear cookies and try again

### Issue: "401 Unauthorized" on protected endpoints
**Solution:**
- Login via browser first: `http://localhost:5000/auth/google`
- Make sure cookies are being sent with requests

### Issue: "Session not persisting"
**Solution:**
- Check `SESSION_SECRET` is set in `.env`
- Verify database has `session` table

---

## Next Steps

Once the API is working:

1. ✅ Test all endpoints (see `API.md`)
2. Add more test vehicles
3. Test image uploads (requires Cloudflare R2 setup)
4. Test all export formats
5. Build React frontend

---

## Quick Test Checklist

- [ ] Server starts without errors
- [ ] Health check returns "healthy"
- [ ] Google OAuth login works
- [ ] User created in database
- [ ] Made yourself admin
- [ ] Can create inventory items
- [ ] Can view inventory
- [ ] Exports work

---

**Need Help?**

Check the logs in console for detailed error messages.

For OAuth issues: https://console.cloud.google.com/
For database issues: Check PostgreSQL logs

---

**Testing Guide v1.0**
Last updated: November 2025
