# CI/CD Setup Instructions

This document explains how to configure the CI/CD pipeline for automatic deployment and Cloudflare cache purging.

## Overview

The CI/CD pipeline automatically:
- ✅ Validates HTML on every push and pull request
- ✅ Checks for broken internal links
- ✅ Deploys to GitHub Pages when pushing to master
- ✅ Purges Cloudflare cache after deployment
- ✅ Runs Lighthouse performance audits
- ✅ Performs weekly link checks (Mondays at 9am UTC)

## Required Setup: GitHub Secrets

You need to add two secrets to your GitHub repository for Cloudflare cache purging to work.

### Step 1: Get Cloudflare Zone ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: **jpautomotivegroup.com**
3. Scroll down on the Overview page
4. Find **Zone ID** in the right sidebar (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
5. Copy this value

### Step 2: Create Cloudflare API Token

1. In Cloudflare Dashboard, click your profile icon (top right)
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit zone DNS** template, or create custom token with these permissions:
   - **Zone** → **Cache Purge** → **Purge**
   - **Zone Resources**: Include → Specific zone → **jpautomotivegroup.com**
5. Click **Continue to summary** → **Create Token**
6. **Copy the token immediately** (you won't see it again)

### Step 3: Add Secrets to GitHub Repository

1. Go to your GitHub repository: `https://github.com/1776simon/1776simon.github.io`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the first secret:
   - **Name**: `CLOUDFLARE_ZONE_ID`
   - **Value**: [paste your Zone ID from Step 1]
   - Click **Add secret**
5. Add the second secret:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: [paste your API Token from Step 2]
   - Click **Add secret**

## Verify Setup

After adding the secrets:

1. Make a small change to `index.html`
2. Commit and push to master:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin master
   ```
3. Go to **Actions** tab in your GitHub repository
4. Watch the workflow run - it should complete successfully with green checkmarks

## Workflow Jobs Explained

### 1. Validate (`validate`)
- Runs on: Push, Pull Request
- Validates HTML5 syntax
- Checks for missing alt attributes on images
- Warns about inline styles

### 2. Link Check (`link-check`)
- Runs on: Push, Schedule (weekly)
- Verifies all internal anchor links (`#home`, `#inventory`, etc.)
- Ensures no broken navigation

### 3. Deploy & Purge Cache (`deploy`)
- Runs on: Push to master only
- Waits for GitHub Pages deployment
- Purges Cloudflare cache automatically
- Shows deployment summary

### 4. Lighthouse Audit (`lighthouse`)
- Runs on: Push to master only
- Tests performance, accessibility, SEO
- Uploads report artifacts
- Provides public URL to view results

## Troubleshooting

### "Secret not found" error
- Verify you added both `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` secrets
- Secret names must match exactly (case-sensitive)

### Cache purge fails with 403 error
- Check that your API token has **Cache Purge** permission
- Verify the token is for the correct zone (jpautomotivegroup.com)

### HTML validation fails
- Check the Actions log for specific errors
- Fix reported HTML issues in `index.html`

### Link check fails
- Ensure all `href="#..."` links have corresponding `id="..."` attributes
- Example: `<a href="#contact">` requires `<section id="contact">`

## Manual Cache Purge (if needed)

If you need to manually purge cache outside of the workflow:

```bash
# Set your credentials
ZONE_ID="your_zone_id"
API_TOKEN="your_api_token"

# Purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Customization

### Change weekly check schedule
Edit `.github/workflows/ci-cd.yml` line 11:
```yaml
- cron: '0 9 * * 1'  # Monday at 9am UTC
```

[Cron syntax help](https://crontab.guru/)

### Disable Lighthouse audits
Remove or comment out the `lighthouse` job in the workflow file.

### Add notifications
Consider adding:
- Slack notifications
- Discord webhooks
- Email alerts on failure

## Support

If you encounter issues:
1. Check the **Actions** tab for detailed logs
2. Review Cloudflare API documentation
3. Verify GitHub Pages is enabled in repository settings
