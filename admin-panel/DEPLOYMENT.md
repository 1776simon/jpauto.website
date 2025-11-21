# Deployment Guide - JP Auto Admin Panel

## Quick Deployment Checklist

### 1. Push to GitHub ✅
```bash
git push origin master
```

### 2. Deploy to Cloudflare Pages

#### A. Create New Project
1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages** → **Create a project**
3. Click **Connect to Git**
4. Select **GitHub** and authorize if needed
5. Choose repository: **JP Auto Website** (or your repo name)

#### B. Configure Build Settings
```
Project name: jp-auto-admin
Production branch: master (or main)
Framework preset: None
Build command: cd admin-panel && npm install && npm run build
Build output directory: admin-panel/dist
Root directory: (leave as /)
```

**Note**: Use `npm` instead of `bun` for Cloudflare Pages compatibility, or install Bun in build command:
```bash
cd admin-panel && curl -fsSL https://bun.sh/install | bash && export PATH="$HOME/.bun/bin:$PATH" && bun install && bun run build
```

#### C. Environment Variables (Optional)
Add in Cloudflare Pages settings → **Environment variables**:
```
VITE_API_URL = https://jp-auto-backend-production.up.railway.app
```

#### D. Deploy
Click **Save and Deploy** - First build will take 2-3 minutes

### 3. Set Up Custom Domain

After successful deployment:

1. In Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `admin.jpautomotivegroup.com`
4. Cloudflare will auto-configure DNS (if domain is on Cloudflare)

Your admin panel will be live at: `https://admin.jpautomotivegroup.com`

### 4. Update Railway Backend Configuration

**Critical**: Update environment variables in Railway:

1. Go to https://railway.app/
2. Select your backend project: **jp-auto-backend-production**
3. Go to **Variables** tab
4. Update these variables:

```bash
# Update ADMIN_URL to new Cloudflare Pages URL
ADMIN_URL=https://admin.jpautomotivegroup.com

# Add new admin URL to ALLOWED_ORIGINS (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://admin.jpautomotivegroup.com,https://consign.jpautomotivegroup.com,https://jp-auto-consignment.pages.dev
```

5. **Important**: Click **Redeploy** or trigger a new deployment to apply changes

### 5. Update Google OAuth Settings

Update your Google Cloud Console OAuth configuration:

1. Go to https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Under **Authorized JavaScript origins**, add:
   ```
   https://admin.jpautomotivegroup.com
   ```
5. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://jp-auto-backend-production.up.railway.app/auth/google/callback
   ```
6. Click **Save**

### 6. Test Deployment

1. Visit https://admin.jpautomotivegroup.com
2. Click **Sign in with Google**
3. Authenticate with your Google account
4. Should redirect to dashboard after successful authentication

## Troubleshooting

### CORS Errors
- **Issue**: `No 'Access-Control-Allow-Origin' header`
- **Fix**: Ensure `ALLOWED_ORIGINS` in Railway includes your Cloudflare Pages URL
- **Fix**: Redeploy Railway backend after changing environment variables

### 404 on Routes
- **Issue**: Direct URLs like `/dashboard` return 404
- **Fix**: Ensure `public/_redirects` file exists with:
  ```
  /*    /index.html   200
  ```

### OAuth Not Working
- **Issue**: OAuth redirect fails or shows error
- **Fix**: Verify Google Cloud Console has correct redirect URI
- **Fix**: Check Railway `ADMIN_URL` matches your Cloudflare Pages URL
- **Fix**: Ensure Railway backend is running (check logs)

### Build Fails
- **Issue**: Cloudflare Pages build fails
- **Fix**: Try using npm instead of bun in build command
- **Fix**: Check build logs for specific errors
- **Fix**: Ensure all dependencies are in `package.json`

### Session Not Persisting
- **Issue**: Login works but session doesn't persist
- **Fix**: Check Railway `COOKIE_DOMAIN` is set to `.jpautomotivegroup.com`
- **Fix**: Ensure Railway `NODE_ENV=production`
- **Fix**: Verify browser allows third-party cookies

## Environment Variables Reference

### Cloudflare Pages
```bash
VITE_API_URL=https://jp-auto-backend-production.up.railway.app
```

### Railway Backend
```bash
ADMIN_URL=https://admin.jpautomotivegroup.com
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://admin.jpautomotivegroup.com,https://consign.jpautomotivegroup.com
COOKIE_DOMAIN=.jpautomotivegroup.com
NODE_ENV=production
SESSION_SECRET=<your-secret>
DATABASE_URL=<postgres-url>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://jp-auto-backend-production.up.railway.app/auth/google/callback
```

## Post-Deployment

After successful deployment:

1. ✅ Test login flow end-to-end
2. ✅ Verify dashboard loads with correct data
3. ✅ Test submissions page
4. ✅ Test inventory page
5. ✅ Test export functionality
6. ✅ Test logout
7. ✅ Test on mobile devices
8. ✅ Update CLAUDE.md with new URLs

## Rollback Plan

If issues occur:

1. In Cloudflare Pages, go to **Deployments**
2. Find the last working deployment
3. Click **⋯** → **Rollback to this deployment**
4. Revert Railway environment variables if needed

## Continuous Deployment

Cloudflare Pages will automatically deploy when you push to the master branch:

```bash
# Make changes
git add .
git commit -m "Update admin panel"
git push origin master
```

Cloudflare will detect the push and trigger a new build automatically.
