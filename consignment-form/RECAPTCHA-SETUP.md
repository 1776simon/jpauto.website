# reCAPTCHA v3 Setup Guide

## What's Been Implemented

✅ **VIN Decoder** - Fully working! Uses NHTSA API (no keys needed)
✅ **reCAPTCHA Frontend** - Integrated, needs site key
✅ **reCAPTCHA Backend** - Verification service ready, needs secret key

---

## Step 1: Register for Google reCAPTCHA v3

1. **Visit Google reCAPTCHA Admin:**
   - Go to: https://www.google.com/recaptcha/admin/create

2. **Fill in the registration form:**
   ```
   Label:               JP Auto Consignment Form
   reCAPTCHA type:      Score based (v3) ✅

   Domains:
   - consign.jpautomotivegroup.com
   - jp-auto-consignment.pages.dev
   - localhost

   ☑ Accept the reCAPTCHA Terms of Service
   ☑ Send alerts to owners
   ```

3. **Click "Submit"**

4. **Copy Your Keys:**
   You'll receive two keys:
   - **Site Key** (public, starts with `6L...`) - for frontend
   - **Secret Key** (private, starts with `6L...`) - for backend

---

## Step 2: Update Frontend with Site Key

Open: `consignment-form/index.html`

**Find line 9:**
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY_HERE" async defer></script>
```

**Replace `YOUR_SITE_KEY_HERE` with your actual Site Key:**
```html
<script src="https://www.google.com/recaptcha/api.js?render=6LcXXXXXXXXXXXX" async defer></script>
```

**Find line 236:**
```javascript
const RECAPTCHA_SITE_KEY = 'YOUR_SITE_KEY_HERE';
```

**Replace with your Site Key:**
```javascript
const RECAPTCHA_SITE_KEY = '6LcXXXXXXXXXXXX';
```

---

## Step 3: Update Railway Backend with Secret Key

### Option A: Via Railway Dashboard (Recommended)

1. Go to Railway dashboard: https://railway.app
2. Select your project: **JPAutoCarData**
3. Select service: **jp-auto-inventory**
4. Go to **"Variables"** tab
5. Click **"New Variable"**
6. Add:
   ```
   Variable Name:  RECAPTCHA_SECRET_KEY
   Value:          6LfXXXXXXXXXXXX (your Secret Key)
   ```
7. Click **"Add"**
8. Service will auto-restart with new variable

### Option B: Via Railway CLI

```bash
cd inventory-system/server
railway variables --set RECAPTCHA_SECRET_KEY="6LfXXXXXXXXXXXX"
```

---

## Step 4: Deploy Updated Code

### Deploy Frontend (Cloudflare Pages)

```bash
# From project root
git add consignment-form
git commit -m "Add reCAPTCHA keys and VIN decoder"
git push

# Cloudflare Pages auto-deploys in ~1 minute
```

### Deploy Backend (Railway)

```bash
cd inventory-system/server
railway up

# Or use GitHub auto-deploy:
git add .
git commit -m "Add reCAPTCHA verification service"
git push
```

---

## Step 5: Test the New Features

### Test VIN Decoder

1. Go to: `https://consign.jpautomotivegroup.com`
2. Enter a VIN: `1HGCV1F30JA123456` (test VIN)
3. Click **"Decode VIN"** button
4. Should auto-fill:
   - Year: 2019
   - Make: Honda
   - Model: Accord

### Test reCAPTCHA

1. Fill out the form completely
2. Click **"Submit Vehicle"**
3. Check browser console (F12 → Console)
4. Should see reCAPTCHA token generated
5. Form submits successfully

### Verify Backend Protection

1. Try submitting without reCAPTCHA token (if you disable the script)
2. Should be blocked with message: "Bot protection verification failed"

---

## How It Works

### VIN Decoder

```
User enters VIN → Click "Decode VIN"
→ Frontend calls NHTSA API
→ Auto-fills Year, Make, Model, Trim
```

**Features:**
- Free NHTSA government API
- No API keys required
- Validates VIN length (17 characters)
- Shows success/error messages
- Button pulses when 17 characters entered

### reCAPTCHA v3

```
User clicks Submit
→ Frontend generates token (invisible to user)
→ Token sent with form data
→ Backend verifies with Google
→ If score < 0.5, submission blocked
→ If score >= 0.5, submission proceeds
```

**Score Interpretation:**
- `1.0` - Very likely human
- `0.5` - Neutral (our threshold)
- `0.0` - Very likely bot

**Features:**
- Invisible to users (no CAPTCHA challenges)
- Adjustable score threshold (currently 0.5)
- Graceful fallback if not configured
- Detailed logging for debugging

---

## Monitoring & Adjusting

### View reCAPTCHA Analytics

1. Go to: https://www.google.com/recaptcha/admin
2. Select your site
3. View metrics:
   - Request volume
   - Score distribution
   - Suspicious activity

### Adjust Score Threshold

If getting too many false positives (real users blocked):

**In:** `inventory-system/server/src/routes/submissions.js` line 43

```javascript
// More lenient (accept more submissions)
recaptchaMiddleware('submit', 0.3),

// Current (balanced)
recaptchaMiddleware('submit', 0.5),

// Stricter (block more bots)
recaptchaMiddleware('submit', 0.7),
```

---

## Troubleshooting

### reCAPTCHA Not Loading

**Check:**
- Site key is correct in both locations (line 9 and 236)
- Domain is registered in reCAPTCHA admin
- No browser console errors

### VIN Decoder Not Working

**Check:**
- VIN is exactly 17 characters
- NHTSA API is reachable: https://vpic.nhtsa.dot.gov/api/
- Browser console for errors

### Backend Blocking Valid Submissions

**Check Railway logs:**
```bash
cd inventory-system/server
railway logs
```

Look for:
- `✅ reCAPTCHA verified: score=X.X`
- `❌ reCAPTCHA verification failed`

**Common issues:**
- Secret key not set
- Site key/secret key mismatch
- Domain not whitelisted

---

## Security Benefits

**With reCAPTCHA + Rate Limiting:**
- ✅ Blocks automated bot submissions
- ✅ Prevents spam flooding
- ✅ Protects database from abuse
- ✅ Invisible to legitimate users
- ✅ No annoying CAPTCHA challenges

**Without reCAPTCHA:**
- ❌ Only rate limiting (5 per hour)
- ❌ Bots can still submit slowly
- ❌ No behavior analysis

---

## Next Steps After Setup

Once both features are working:

1. ✅ Monitor reCAPTCHA scores for first week
2. ✅ Adjust threshold if needed
3. ✅ Test VIN decoder with real customer VINs
4. ✅ Consider adding email notifications for new submissions
5. ✅ Build admin dashboard to review submissions

---

## Summary

**VIN Decoder:** Ready to use immediately!
**reCAPTCHA:** Just add your keys and deploy

Both features significantly improve the user experience:
- VIN decoder saves time filling forms
- reCAPTCHA protects against spam without annoying users
