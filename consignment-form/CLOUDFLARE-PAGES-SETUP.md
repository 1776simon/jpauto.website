# Cloudflare Pages Deployment Guide

Quick guide to deploy the consignment form to `consign.jpautomotivegroup.com`

## Prerequisites

- GitHub account
- Cloudflare account with domain `jpautomotivegroup.com` added
- Git installed on your computer

## Step 1: Push to GitHub

If you haven't already, create a GitHub repository and push the code:

```bash
# Navigate to project root
cd "C:\Users\faxad\WebstormProjects\JP Auto Website"

# If not already a git repo, initialize it
git init

# Add all files
git add .

# Commit
git commit -m "Add consignment form for Cloudflare Pages deployment"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/YOUR-USERNAME/jp-auto-website.git

# Push to GitHub
git push -u origin main
```

## Step 2: Create Cloudflare Pages Project

1. **Log into Cloudflare Dashboard**
   - Go to: https://dash.cloudflare.com

2. **Navigate to Pages**
   - Click "Workers & Pages" in the left sidebar
   - Click "Create application"
   - Click "Pages" tab
   - Click "Connect to Git"

3. **Connect GitHub Repository**
   - Click "Connect GitHub" (authorize if needed)
   - Select your repository: `jp-auto-website`
   - Click "Begin setup"

4. **Configure Build Settings**
   ```
   Project name: jp-auto-consignment-form
   Production branch: main
   Framework preset: None
   Build command: (leave empty)
   Build output directory: (leave empty)
   Root directory (advanced): consignment-form
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for deployment to complete (~1-2 minutes)
   - You'll get a URL like: `jp-auto-consignment-form.pages.dev`

## Step 3: Add Custom Domain

1. **In Cloudflare Pages Project Settings**
   - Click your newly created project
   - Go to "Custom domains" tab
   - Click "Set up a custom domain"

2. **Add Subdomain**
   - Enter: `consign.jpautomotivegroup.com`
   - Click "Continue"
   - Cloudflare will automatically add DNS records (since domain is in Cloudflare)

3. **Wait for DNS Propagation**
   - Should be active within 5-10 minutes
   - Status will show "Active" when ready

4. **Verify HTTPS**
   - Cloudflare automatically provisions SSL certificate
   - Visit: `https://consign.jpautomotivegroup.com`
   - Should show your consignment form

## Step 4: Test the Form

1. **Visit the URL**
   ```
   https://consign.jpautomotivegroup.com
   ```

2. **Test Submission**
   - Fill out the form with test data
   - Upload a test image
   - Submit and verify it reaches Railway backend

3. **Check Submissions**
   - Log into admin panel: `https://jp-auto-inventory-production.up.railway.app/auth/google`
   - Verify submission appears in pending submissions

## DNS Configuration (Manual)

If DNS doesn't auto-configure, manually add:

**In Cloudflare DNS Settings:**
```
Type: CNAME
Name: consign
Target: jp-auto-consignment-form.pages.dev
Proxy status: Proxied (Orange cloud)
TTL: Auto
```

## Auto-Deployment

Every push to the `main` branch will automatically trigger a new deployment:

```bash
# Make changes to consignment-form/index.html
# Then:
git add .
git commit -m "Update consignment form"
git push

# Cloudflare Pages will auto-deploy in ~1 minute
```

## Troubleshooting

### Form not loading
- Check Cloudflare Pages build logs
- Verify root directory is set to `consignment-form`
- Check DNS records are active

### API calls failing
- Verify Railway backend is running
- Check API_URL in index.html is correct: `https://jp-auto-inventory-production.up.railway.app`
- Check CORS settings in Railway backend

### Custom domain not working
- Wait 10-15 minutes for DNS propagation
- Clear browser cache
- Verify CNAME record exists in Cloudflare DNS
- Check SSL/TLS encryption mode is "Full" or "Full (strict)"

### Images not uploading
- Verify Cloudflare R2 credentials in Railway environment variables
- Check browser console for errors
- Test API directly with Postman

## Performance Optimization

Cloudflare Pages includes:
- Global CDN (100+ locations)
- Automatic image optimization (if you enable it)
- Brotli compression
- HTTP/3 support
- DDoS protection

## Monitoring

**View Analytics:**
1. Go to Pages project
2. Click "Analytics" tab
3. Monitor:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Cache hit ratio

**View Deployment History:**
1. Go to Pages project
2. Click "Deployments" tab
3. See all deployments, rollback if needed

## Rollback

If you need to rollback to a previous version:

1. Go to "Deployments" tab
2. Find the working deployment
3. Click "..." menu
4. Click "Rollback to this deployment"

## Next Steps

- Set up Google Analytics on the form
- Add reCAPTCHA for spam protection
- Configure email notifications for new submissions
- Monitor submission rates and optimize conversion
