# Export Endpoints Reference

Quick reference for all inventory export endpoints.

## Base URL
```
https://jp-auto-inventory-production.up.railway.app/api/exports
```

---

## Dealer Center Exports

### 1. Download CSV Export (Manual)
**Endpoint**: `POST /api/exports/dealer-center`
**Auth**: Required (Manager/Admin)
**Returns**: CSV file download
**Use**: Download export file to your computer

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/dealer-center', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dealer-center-export.csv';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
  console.log('✅ Export downloaded!');
});
```

---

### 2. Upload to Dealer Center FTP (Automated)
**Endpoint**: `POST /api/exports/dealer-center/upload`
**Auth**: Required (Manager/Admin)
**Returns**: JSON response with upload status
**Use**: Export and upload directly to Dealer Center's FTP server

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/dealer-center/upload', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(result => {
  console.log('✅ FTP Upload Result:', result);
});
```

**Response**:
```json
{
  "success": true,
  "message": "Export uploaded to Dealer Center FTP successfully",
  "filename": "29007654_20251205.csv",
  "vehicleCount": 10,
  "ftpHost": "ftp.dealercenter.net",
  "timestamp": "2025-12-05T21:35:00.000Z"
}
```

**Features**:
- ✅ Automatically generates CSV with HTML-formatted descriptions
- ✅ Uses custom CDN domain (`cdn.jpautomotivegroup.com`) for photos
- ✅ Uploads to FTP with correct filename format (`DCID_YYYYMMDD.csv`)
- ✅ Updates database export timestamps

**Scheduled**: Runs automatically every day at **2:00 AM**

---

## Other Platform Exports

### 3. Jekyll Website Export
**Endpoint**: `POST /api/exports/jekyll`
**Auth**: Required (Manager/Admin)
**Returns**: JSON response

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/jekyll', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log);
```

**Scheduled**: Runs automatically every day at **1:55 AM**

---

### 4. AutoTrader Export
**Endpoint**: `POST /api/exports/autotrader`
**Auth**: Required (Manager/Admin)
**Returns**: XML file download

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/autotrader', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'autotrader-export.xml';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
});
```

---

### 5. CarGurus Export
**Endpoint**: `POST /api/exports/cargurus`
**Auth**: Required (Manager/Admin)
**Returns**: XML file download

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/cargurus', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cargurus-export.xml';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
});
```

---

### 6. Facebook Marketplace Export
**Endpoint**: `POST /api/exports/facebook`
**Auth**: Required (Manager/Admin)
**Returns**: CSV file download

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/facebook', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'facebook-export.csv';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
});
```

---

## Export History

### Get Export History
**Endpoint**: `GET /api/exports/history`
**Auth**: Required (Manager/Admin)
**Returns**: JSON with export statistics

**Browser Console**:
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/history', {
  method: 'GET',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log);
```

---

## Dealer Center Export Features

### Current Formatting

1. **Photo URLs**:
   - Custom domain: `https://cdn.jpautomotivegroup.com/vehicles/VIN/...`
   - Pipe-separated: `photo1.jpg|photo2.jpg|photo3.jpg`

2. **Description HTML Formatting**:
   - `**Bold**` → `<strong>Bold</strong>`
   - `*Italic*` → `<em>Italic</em>`
   - `# Heading` → `<strong>Heading</strong><br>`
   - Newlines → `<br>`
   - Bullet points → `•`

3. **File Format**:
   - Filename: `29007654_YYYYMMDD.csv` (DCID + date)
   - Fields: DealerID, VIN, Year, Make, Model, Price, PhotoURLs, Description, etc.

---

## Quick Commands

### Test Dealer Center FTP Upload
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/dealer-center/upload', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(result => console.log('FTP Result:', result));
```

### Download for Manual Review
```javascript
fetch('https://jp-auto-inventory-production.up.railway.app/api/exports/dealer-center', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dealer-center-export.csv';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
  console.log('Downloaded!');
});
```

---

## Automated Schedule

| Export | Time (PST) | Endpoint |
|--------|-----------|----------|
| Jekyll Website | 1:55 AM | `/api/exports/jekyll` |
| Dealer Center FTP | 2:00 AM | `/api/exports/dealer-center/upload` |

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Not logged in to admin panel
   - Solution: Login at https://admin.jpautomotivegroup.com first

2. **FTP Upload Failed**: Check FTP credentials
   - Verify: `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` in Railway environment variables

3. **Photos Not Loading in DC**: Old R2 domain
   - Solution: Run photo URL migration (already completed)

---

## Related Documentation

- **Full API Docs**: `inventory-system/API.md`
- **Deployment Guide**: `inventory-system/DEPLOYMENT.md`
- **Export Configuration**: `inventory-system/server/src/config/dealerCenter.js`
