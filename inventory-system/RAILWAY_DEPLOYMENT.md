# Railway Deployment - Quick Start Guide

✅ Railway CLI installed successfully!

Follow these steps to deploy to Railway:

---

## Step 1: Login to Railway

Open a **new terminal** in the `inventory-system/server` directory and run:

```bash
cd inventory-system/server
railway login
```

This will:
- Open your browser
- Ask you to authorize Railway CLI
- Complete the login

**After successful login, you'll see:** `Logged in as <your-email>`

---

## Step 2: Initialize Railway Project

```bash
railway init
```

You'll be asked:
- **"Starting Point"**: Select **"Empty Project"**
- **"Project Name"**: Enter `jp-auto-inventory` (or any name you prefer)

This creates a new Railway project.

---

## Step 3: Add PostgreSQL Database

```bash
railway add
```

When prompted:
- Select **"PostgreSQL"**

Railway will:
- ✅ Provision a PostgreSQL database
- ✅ Set `DATABASE_URL` environment variable automatically
- ✅ Link it to your project

**This takes about 30 seconds.**

---

## Step 4: Set Environment Variables

### Generate Session Secret

First, generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (a long random string).

### Set Variables via CLI

```bash
# Basic settings
railway variables --set NODE_ENV=production
railway variables --set PORT=5000
railway variables --set CLIENT_URL=https://jpautomotivegroup.com

# Session secret (paste the value you generated above)
railway variables --set SESSION_SECRET=your-generated-secret-here

# Image processing settings
railway variables --set MAX_IMAGE_SIZE_MB=10
railway variables --set MAX_IMAGES_PER_SUBMISSION=40
railway variables --set IMAGE_QUALITY=80
railway variables --set IMAGE_MAX_WIDTH=2000
railway variables --set THUMBNAIL_WIDTH=400
railway variables --set MAX_UPLOAD_SIZE_MB=200

# Website URL
railway variables --set WEBSITE_URL=https://jpautomotivegroup.com

# Disable virus scan for now
railway variables --set ENABLE_VIRUS_SCAN=false
```

**Note:** We'll add OAuth and R2 credentials later after we get the Railway URL.

---

## Step 5: Deploy to Railway

```bash
railway up
```

This will:
- Upload your code
- Build the application
- Start the server
- Give you a deployment URL

**This takes 2-3 minutes.**

You'll see:
```
✓ Deployment live at https://jp-auto-inventory-production.up.railway.app
```

**Copy this URL!** You'll need it for OAuth setup.

---

## Step 6: Get Your Railway URL

After deployment, get your public URL:

```bash
railway domain
```

If no domain is set up yet:

```bash
# Generate a Railway-provided domain
railway domain --generate
```

This gives you a URL like:
```
https://jp-auto-inventory-production-xxxx.up.railway.app
```

**Save this URL!**

---

## Step 7: Setup Google OAuth

Now that you have your Railway URL, let's set up OAuth:

### 7.1 Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name: **"JP Auto Inventory"**

### 7.2 Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search **"Google+ API"**
3. Click **Enable**

### 7.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External**
3. Fill in:
   - **App name:** JP Auto Inventory
   - **User support email:** your-email@jpautomotivegroup.com
   - **Developer contact:** your-email@jpautomotivegroup.com
4. Click **Save and Continue** through all steps
5. Add **Test Users**: Add your email for testing

### 7.4 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: **JP Auto Inventory - Production**
5. **Authorized redirect URIs:** Add your Railway URL:
   ```
   https://your-app-production.up.railway.app/auth/google/callback
   ```
   Replace with your actual Railway URL!

6. Click **Create**
7. **Copy the Client ID and Client Secret**

### 7.5 Add OAuth to Railway

```bash
railway variables --set GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
railway variables --set GOOGLE_CLIENT_SECRET="your-client-secret"
railway variables --set GOOGLE_CALLBACK_URL="https://your-app.up.railway.app/auth/google/callback"
```

Replace with your actual values!

### 7.6 Set API_URL

```bash
railway variables --set API_URL="https://your-app.up.railway.app"
```

---

## Step 8: Redeploy with OAuth

After adding OAuth variables, redeploy:

```bash
railway up
```

Or it might auto-redeploy when you add variables.

---

## Step 9: Test Your Deployment

### 9.1 Health Check

Visit in browser:
```
https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

### 9.2 Test OAuth Login

Visit:
```
https://your-app.up.railway.app/auth/google
```

- Should redirect to Google login
- Login with your Google account
- After authorization, you'll be redirected

### 9.3 Check User Created

View logs to confirm user was created:

```bash
railway logs
```

Look for: `✅ New user registered: your-email@gmail.com`

---

## Step 10: Make Yourself Admin

### Option A: Using Railway CLI

```bash
railway run psql $DATABASE_URL
```

Then in psql:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';

\q
```

### Option B: Using Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Select your project
3. Click on **PostgreSQL** service
4. Click **Data** tab
5. Click **Query** tab
6. Run:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@gmail.com';
```

---

## Step 11: Test API Endpoints

Now test your live API!

### Get Inventory Stats
```bash
curl https://your-app.up.railway.app/api/inventory/stats
```

### Check Auth Status

Visit in browser:
```
https://your-app.up.railway.app/auth/status
```

After logging in, you should see your user info.

---

## Optional: Setup Cloudflare R2 (For Image Uploads)

If you want to test image uploads now:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2**
3. Create bucket: `jp-auto-inventory`
4. Generate API tokens
5. Add to Railway:

```bash
railway variables --set R2_ACCOUNT_ID="your-account-id"
railway variables --set R2_ACCESS_KEY_ID="your-access-key"
railway variables --set R2_SECRET_ACCESS_KEY="your-secret-key"
railway variables --set R2_BUCKET_NAME="jp-auto-inventory"
railway variables --set R2_PUBLIC_URL="https://your-bucket.r2.dev"
```

---

## Useful Railway Commands

```bash
# View logs
railway logs

# Open Railway dashboard
railway open

# Check status
railway status

# List environment variables
railway variables

# Connect to database
railway run psql $DATABASE_URL

# Restart service
railway restart
```

---

## Troubleshooting

### "Database connection failed"

Check logs:
```bash
railway logs
```

PostgreSQL should be automatically connected via `DATABASE_URL`.

### "OAuth error"

- Verify redirect URI in Google Console matches exactly
- Check `GOOGLE_CALLBACK_URL` environment variable
- Make sure you added yourself as test user

### "Build failed"

Check logs:
```bash
railway logs --build
```

Common issues:
- Missing dependencies (check package.json)
- Syntax errors

---

## Next Steps

After successful deployment:

1. ✅ Test all API endpoints
2. ✅ Create test inventory items
3. ✅ Test exports
4. Build React frontend
5. Connect frontend to this API

---

## Summary

Your deployment is live at: `https://your-app.up.railway.app`

- **API Documentation:** See `API.md`
- **Full Docs:** See `README.md`
- **Railway Dashboard:** https://railway.app

---

**Ready to deploy?** Just run:

```bash
cd inventory-system/server
railway login
railway init
railway add  # Select PostgreSQL
railway up
```

🚀 **You'll be live in 5 minutes!**
