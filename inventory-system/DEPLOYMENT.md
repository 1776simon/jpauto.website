# JP Auto Inventory System - Deployment Guide

Complete step-by-step guide to deploy the inventory management system to production.

## Pre-Deployment Checklist

- [ ] Railway account created
- [ ] Cloudflare account with R2 enabled
- [ ] Google OAuth credentials obtained
- [ ] Microsoft OAuth credentials obtained (optional)
- [ ] Custom domain ready (inventory.jpautomotivegroup.com)
- [ ] GitHub repository created for code

## Step 1: Cloudflare R2 Setup

### 1.1 Create R2 Bucket

1. Login to Cloudflare Dashboard
2. Navigate to **R2 Object Storage**
3. Click **Create Bucket**
   - Name: `jp-auto-inventory`
   - Location: Automatic
4. Click **Create Bucket**

### 1.2 Enable Public Access

1. Go to bucket settings
2. Under **Public Access**, click **Allow Access**
3. Copy the public URL: `https://pub-xxxxx.r2.dev`

### 1.3 Generate API Tokens

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
   - Name: `JP Auto Inventory System`
   - Permissions: Object Read & Write
   - TTL: Forever
3. Copy the credentials:
   - Access Key ID
   - Secret Access Key
   - Account ID

**Save these securely - you'll need them for Railway!**

## Step 2: OAuth Configuration

### 2.1 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "JP Auto Inventory"
3. Enable **Google+ API**
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen:
   - App name: JP Auto Inventory
   - User support email: info@jpautomotivegroup.com
   - Authorized domains: jpautomotivegroup.com
6. Create OAuth client:
   - Application type: Web application
   - Name: JP Auto Inventory
   - Authorized redirect URIs:
     - `https://inventory.jpautomotivegroup.com/auth/google/callback`
     - `http://localhost:5000/auth/google/callback` (for testing)
7. Copy **Client ID** and **Client Secret**

### 2.2 Microsoft OAuth Setup (Optional)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App Registrations**
3. Click **New Registration**:
   - Name: JP Auto Inventory
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: `https://inventory.jpautomotivegroup.com/auth/microsoft/callback`
4. Copy **Application (client) ID**
5. Go to **Certificates & Secrets** → **New Client Secret**
6. Copy the secret value

## Step 3: Railway Deployment

### 3.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

### 3.2 Login to Railway

```bash
railway login
```

### 3.3 Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo** (recommended) or **Empty Project**

### 3.4 Add PostgreSQL Database

1. In your Railway project, click **New**
2. Select **Database** → **PostgreSQL**
3. Railway will automatically provision a database
4. Copy the **DATABASE_URL** from the database service

### 3.5 Deploy Application

#### Option A: Deploy from GitHub (Recommended)

1. Connect your GitHub repository
2. Railway will auto-detect Node.js
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`

#### Option B: Deploy via CLI

```bash
cd inventory-system/server
railway init
railway up
```

### 3.6 Set Environment Variables

In Railway dashboard, go to your service → **Variables** and add:

```env
# Database (auto-filled by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Server
NODE_ENV=production
PORT=5000
API_URL=https://inventory.jpautomotivegroup.com
CLIENT_URL=https://jpautomotivegroup.com

# Session
SESSION_SECRET=<generate-random-secret-here>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://inventory.jpautomotivegroup.com/auth/google/callback

# Microsoft OAuth (optional)
MICROSOFT_CLIENT_ID=<your-microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<your-microsoft-client-secret>
MICROSOFT_CALLBACK_URL=https://inventory.jpautomotivegroup.com/auth/microsoft/callback

# Cloudflare R2
R2_ACCOUNT_ID=<your-r2-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret>
R2_BUCKET_NAME=jp-auto-inventory
R2_PUBLIC_URL=<your-r2-public-url>

# Image Processing
MAX_IMAGE_SIZE_MB=10
MAX_IMAGES_PER_SUBMISSION=40
IMAGE_QUALITY=80
IMAGE_MAX_WIDTH=2000
THUMBNAIL_WIDTH=400

# File Upload
MAX_UPLOAD_SIZE_MB=200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Website URL
WEBSITE_URL=https://jpautomotivegroup.com

# Export Paths (if using local exports)
JEKYLL_EXPORT_PATH=../../_vehicles
EXPORT_OUTPUT_PATH=./exports
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.7 Configure Custom Domain

1. In Railway project → **Settings** → **Domains**
2. Add custom domain: `inventory.jpautomotivegroup.com`
3. Add the CNAME record to your DNS:
   - Type: CNAME
   - Name: inventory
   - Value: `<your-project>.railway.app`
4. Wait for SSL certificate provisioning (5-10 minutes)

## Step 4: Database Initialization

### 4.1 Run Migrations

```bash
# Via Railway CLI
railway run npm run db:migrate

# Or via Railway dashboard shell
cd server && npm run db:migrate
```

### 4.2 Verify Database

Check that all tables were created:

```bash
railway run psql $DATABASE_URL -c "\dt"
```

You should see:
- users
- pending_submissions
- inventory
- export_logs
- activity_logs
- session

## Step 5: Create Admin User

Since OAuth is required, you'll need to:

1. Visit `https://inventory.jpautomotivegroup.com/auth/google`
2. Login with your Google account
3. The system will create a user automatically
4. Update the user role to admin in database:

```bash
railway run psql $DATABASE_URL
```

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@jpautomotivegroup.com';
```

## Step 6: Test Everything

### 6.1 Health Check

Visit: `https://inventory.jpautomotivegroup.com/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-19T..."
}
```

### 6.2 Test OAuth Login

1. Visit admin panel
2. Click "Login with Google"
3. Authorize the application
4. Should redirect to dashboard

### 6.3 Test Image Upload

1. Navigate to "Add Vehicle"
2. Fill out form
3. Upload test images
4. Submit
5. Verify images appear in Cloudflare R2 bucket

### 6.4 Test Exports

1. Add 2-3 test vehicles
2. Go to "Exports" section
3. Generate each export type:
   - Jekyll (should create .md files)
   - Dealer Center CSV
   - AutoTrader XML
   - CarGurus XML
   - Facebook CSV
4. Download and verify file contents

## Step 7: Production Monitoring

### 7.1 Railway Monitoring

Railway provides built-in monitoring:
- CPU usage
- Memory usage
- Network traffic
- Logs

### 7.2 Setup Alerts

1. In Railway → **Settings** → **Notifications**
2. Add email for deployment failures
3. Set up downtime alerts

### 7.3 Database Backups

Railway automatically backs up PostgreSQL:
- Point-in-time recovery
- Daily snapshots
- Retention: 30 days

## Step 8: Workflow Integration

### 8.1 Connect to Main Website

Update your main Jekyll site to pull inventory:

```yaml
# _config.yml
collections:
  vehicles:
    output: true
    permalink: /vehicles/:title/
```

### 8.2 Automate Jekyll Exports

**Option A: Manual (Recommended Initially)**
1. Generate Jekyll export in admin
2. Download files
3. Commit to main website repo
4. Push to deploy

**Option B: Automated (Future Enhancement)**
- Setup GitHub Actions
- Auto-export on inventory changes
- Auto-commit to website repo

### 8.3 Setup Ad Provider Feeds

**AutoTrader:**
1. Login to AutoTrader dealer portal
2. Upload XML feed
3. Schedule automatic updates (daily/weekly)

**CarGurus:**
1. Login to CarGurus dealer dashboard
2. Navigate to Inventory Feed
3. Upload XML
4. Enable automatic feed refresh

**Facebook Marketplace:**
1. Go to Facebook Business Manager
2. Commerce Manager → Inventory
3. Upload CSV feed
4. Set update frequency

## Troubleshooting

### Deployment Fails

```bash
# Check logs
railway logs

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port conflicts
```

### Database Connection Issues

```bash
# Verify DATABASE_URL
railway variables

# Test connection
railway run npm run db:migrate
```

### OAuth Not Working

**Common issues:**
- Callback URLs don't match exactly
- Missing HTTPS in production
- Wrong client credentials

**Fix:**
1. Double-check OAuth console settings
2. Ensure URLs match exactly (with/without trailing slash)
3. Clear browser cookies and retry

### Images Not Uploading

**Check:**
- R2 credentials are correct
- Bucket has public access enabled
- File size limits are reasonable
- Sharp library installed correctly

```bash
railway run npm list sharp
```

## Estimated Costs

**Railway (with PostgreSQL):**
- Starter: $5/month (512MB RAM, shared CPU)
- Developer: $10/month (1GB RAM, shared CPU) ← Recommended
- Team: $20/month (2GB RAM, dedicated CPU)

**Cloudflare R2:**
- Storage: $0.015/GB-month
- Class A operations: $4.50/million
- Class B operations: $0.36/million
- Estimated: $0-2/month for 1000 vehicles

**Total: $10-15/month**

## Maintenance

### Monthly Tasks
- [ ] Review export logs
- [ ] Check disk usage (images)
- [ ] Review user access
- [ ] Backup critical data

### Quarterly Tasks
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Optimize database
- [ ] Test disaster recovery

## Next Steps

After successful deployment:

1. Train staff on admin panel
2. Add more team members with OAuth
3. Setup regular export schedules
4. Monitor system performance
5. Collect feedback and iterate

---

## Support

For deployment issues:
- Railway Docs: https://docs.railway.app
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2
- Internal: tech@jpautomotivegroup.com

---

**Deployment Guide v1.0**
Last updated: November 2025
