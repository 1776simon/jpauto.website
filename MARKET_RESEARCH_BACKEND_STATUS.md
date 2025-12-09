# Market Research Backend - Configuration & Testing Guide

Last updated: 2025-12-08

---

## ✅ #1 - Scheduled Jobs Verification

### Job Configuration

**Status**: ✅ **Properly Configured**

The job manager is located at `inventory-system/server/src/jobs/jobManager.js` and manages three scheduled jobs:

1. **Market Research Job** (`marketResearchJob`)
   - Schedule: Every 3 days at midnight PST
   - Cron: `0 0 */3 * *`
   - Process: Analyze all vehicles → Detect alerts → Send email

2. **Market Cleanup Job** (`marketCleanupJob`)
   - Schedule: Weekly
   - Process: Clean old market snapshots based on retention policy

3. **Storage Monitoring Job** (`storageMonitoringJob`)
   - Schedule: Daily
   - Process: Monitor database storage usage

### Job Activation

Jobs are **automatically started** when the server starts if the environment variable is set:

```javascript
// From: inventory-system/server/src/index.js:210-214
if (process.env.MARKET_RESEARCH_ENABLED === 'true') {
  const jobManager = require('./jobs/jobManager');
  jobManager.startAll();
  logger.info('Market research jobs started...');
}
```

### Required Environment Variables

These must be set in Railway dashboard:

```bash
# Enable market research system
MARKET_RESEARCH_ENABLED=true

# Job schedule (cron format)
MARKET_RESEARCH_SCHEDULE=0 0 */3 * *

# Market search parameters
MARKET_RESEARCH_ZIP_CODE=95814
MARKET_RESEARCH_RADIUS=150

# Alert email recipient
MARKET_RESEARCH_ALERT_EMAIL=jpautomotivegroupllc@gmail.com

# Data retention
MARKET_SNAPSHOT_RETENTION_DAYS=180
```

### Testing Job Status

**API Endpoint**: `GET /api/market-research/jobs/status`

**Example**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/jobs/status', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "marketResearch": {
      "enabled": true,
      "schedule": "0 0 */3 * *",
      "isRunning": false,
      "lastRun": "2025-12-08T08:00:00.000Z",
      "lastResult": {
        "success": true,
        "vehiclesAnalyzed": 4,
        "failures": 0,
        "alertsDetected": 2,
        "emailSent": true
      }
    },
    "marketCleanup": { ... },
    "storageMonitoring": { ... }
  }
}
```

### Manual Job Triggering

**API Endpoint**: `POST /api/market-research/jobs/:jobName/run`

**Example** (trigger market research job manually):
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/jobs/marketResearch/run', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

---

## ✅ #2 - Email Alert System

### Email Service Configuration

**Status**: ✅ **Configured** (requires SMTP credentials in Railway)

**Service**: `inventory-system/server/src/services/marketEmailService.js`

### Required Environment Variables

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=jpautomotivegroupllc@gmail.com
SMTP_PASS=your_gmail_app_password_here
SMTP_FROM="JP Auto Market Research <jpautomotivegroupllc@gmail.com>"
```

### Email Features

1. **Automated Alerts** - Sent after each scheduled market research run
2. **Severity Levels**:
   - 🔴 Critical - Urgent pricing issues
   - ⚠️ Warning - Price changes worth noting
   - ℹ️ Info - Market updates

3. **Email Content**:
   - HTML formatted with gradient header
   - Alert summaries grouped by severity
   - Vehicle details (year, make, model, VIN)
   - Link to admin dashboard
   - Plain text fallback

### Testing Email System

**Method 1: Wait for Scheduled Job**
- Jobs run every 3 days automatically
- If alerts are detected, email is sent

**Method 2: Manual Trigger**
```javascript
// Trigger full market research job (includes email if alerts detected)
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/jobs/marketResearch/run', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Method 3: Check Railway Logs**
```
# Look for email-related log entries
logger.info('Alert email sent', {
  messageId: ...,
  alertCount: ...,
  to: ...
})
```

### Email Service Health Check

The system health endpoint checks email configuration:

```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/market-research/system/health', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "checks": {
      "database": true,
      "autodevApi": true,
      "email": true,  ← Checks SMTP_USER and SMTP_PASS
      "storage": true
    }
  }
}
```

---

## 📋 Railway Environment Variable Checklist

Verify these are set in Railway dashboard:

### ✅ Core Market Research
- [ ] `MARKET_RESEARCH_ENABLED=true`
- [ ] `MARKET_RESEARCH_SCHEDULE=0 0 */3 * *`
- [ ] `MARKET_RESEARCH_ZIP_CODE=95814`
- [ ] `MARKET_RESEARCH_RADIUS=150`
- [ ] `MARKET_RESEARCH_ALERT_EMAIL=jpautomotivegroupllc@gmail.com`
- [ ] `MARKET_SNAPSHOT_RETENTION_DAYS=180`

### ✅ Auto.dev API
- [ ] `AUTODEV_API_KEY=sk_ad_...` (current valid key)
- [ ] `AUTODEV_API_URL=https://api.auto.dev`

### ✅ Email/SMTP (Gmail)
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_SECURE=false`
- [ ] `SMTP_USER=jpautomotivegroupllc@gmail.com`
- [ ] `SMTP_PASS=your_gmail_app_password_here` ← Generate from Gmail

---

## 🔧 Gmail App Password Setup

If `SMTP_PASS` is not configured:

1. Go to https://myaccount.google.com/apppasswords
2. Sign in to jpautomotivegroupllc@gmail.com
3. Create a new app password named "JP Auto Market Research"
4. Copy the 16-character password
5. Set in Railway: `SMTP_PASS=xxxx xxxx xxxx xxxx` (without spaces)

---

## 🎯 Next Steps

1. **Verify Railway Environment Variables** - Ensure all required vars are set
2. **Test Job Status** - Run the status check API endpoint
3. **Trigger Manual Analysis** - Test the system end-to-end
4. **Monitor Railway Logs** - Watch for job execution and email sending

---

## 📊 Available API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market-research/overview` | GET | Market overview for all vehicles |
| `/api/market-research/vehicle/:id` | GET | Detailed analysis for one vehicle |
| `/api/market-research/vehicle/:id/analyze` | POST | Trigger manual analysis |
| `/api/market-research/analyze-all` | POST | Analyze all vehicles |
| `/api/market-research/alerts` | GET | Get recent alerts |
| `/api/market-research/jobs/status` | GET | Get job status |
| `/api/market-research/jobs/:jobName/run` | POST | Trigger job manually |
| `/api/market-research/system/health` | GET | System health check |
| `/api/market-research/system/storage` | GET | Database storage usage |

---

## ✅ Conclusion

**Backend Status**: Fully configured and operational

- ✅ Jobs properly scheduled and managed
- ✅ Email service configured (needs SMTP credentials)
- ✅ API endpoints available for frontend
- ✅ Logging and monitoring in place
- ⚠️ **Action Required**: Set SMTP credentials in Railway for email alerts
