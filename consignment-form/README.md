# JP Auto Consignment Form

Standalone consignment sales submission form for JP Auto.

## Deployment URL
`consign.jpautomotivegroup.com`

## Tech Stack
- Static HTML/JavaScript
- Tailwind CSS via CDN
- Connects to Railway API backend

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

**Why Cloudflare Pages?**
- Free hosting with unlimited bandwidth
- Global CDN for fast loading
- Same ecosystem as R2 image storage
- Easy subdomain setup
- Auto-deploy from GitHub

**Setup Steps:**

1. **Create GitHub Repository (if not already done)**
   ```bash
   cd consignment-form
   git init
   git add .
   git commit -m "Initial commit - consignment form"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Cloudflare Pages**
   - Log into Cloudflare Dashboard
   - Go to "Workers & Pages" > "Create Application" > "Pages"
   - Connect to your GitHub repository
   - Select the repository and branch
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: (leave empty)
     - **Build output directory**: `/` (or leave empty)
     - **Root directory**: `consignment-form`
   - Click "Save and Deploy"

3. **Configure Custom Domain**
   - After deployment, go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter: `consign.jpautomotivegroup.com`
   - Cloudflare will automatically configure DNS (if domain is in Cloudflare)
   - If domain is not in Cloudflare, add CNAME record:
     ```
     Type: CNAME
     Name: consign
     Target: <your-pages-url>.pages.dev
     Proxy: Yes (Orange cloud)
     ```

4. **Verify Deployment**
   - Visit `https://consign.jpautomotivegroup.com`
   - Test form submission

**Auto-Deploy:**
Every push to the `main` branch will automatically deploy to Cloudflare Pages.

---

### Option 2: Netlify

**Setup Steps:**

1. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   cd consignment-form
   netlify init
   netlify deploy --prod
   ```

2. **Or Deploy via Netlify Dashboard**
   - Go to netlify.com
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select repository
   - Build settings:
     - **Base directory**: `consignment-form`
     - **Build command**: (leave empty)
     - **Publish directory**: `.`
   - Deploy

3. **Configure Custom Domain**
   - Go to "Domain settings" > "Add custom domain"
   - Enter: `consign.jpautomotivegroup.com`
   - Add DNS record in your domain provider:
     ```
     Type: CNAME
     Name: consign
     Target: <your-site-name>.netlify.app
     ```

---

### Option 3: Vercel

**Setup Steps:**

1. **Deploy via Vercel CLI**
   ```bash
   npm install -g vercel
   cd consignment-form
   vercel
   vercel --prod
   ```

2. **Configure Custom Domain**
   - Go to project settings > "Domains"
   - Add `consign.jpautomotivegroup.com`
   - Configure DNS with provided settings

---

### Option 4: Keep in Jekyll (Not Recommended)

If you want to keep it in Jekyll:

1. Move `index.html` to Jekyll `_includes/consignment-form.html`
2. Create a page layout that includes it
3. Configure Jekyll to build and serve on subdomain
4. Deploy entire Jekyll site to hosting provider

**Drawbacks:**
- Rebuilds entire Jekyll site for single-page updates
- More complex deployment
- Less flexible

---

## DNS Configuration (Manual Setup)

If your domain DNS is NOT managed by Cloudflare:

**For Cloudflare Pages:**
```
Type: CNAME
Name: consign
Target: <your-pages-url>.pages.dev
TTL: Auto or 300
```

**For Netlify:**
```
Type: CNAME
Name: consign
Target: <your-site-name>.netlify.app
TTL: Auto or 300
```

**For Vercel:**
```
Type: CNAME
Name: consign
Target: cname.vercel-dns.com
TTL: Auto or 300
```

---

## Testing Locally

Simply open `index.html` in a browser or use:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

Visit: `http://localhost:8000`

---

## API Configuration

The form connects to the Railway backend at:
```javascript
const API_URL = 'https://jp-auto-inventory-production.up.railway.app';
```

Endpoints used:
- `POST /api/submissions` - Submit vehicle data
- `POST /api/submissions/:id/images` - Upload vehicle images

---

## Features

- Customer information collection
- Complete vehicle details
- VIN validation (17 characters)
- Multiple image upload (up to 40 photos)
- Image preview with remove functionality
- Progress indicator
- Success/error messaging
- Responsive design (mobile-friendly)
- Rate limiting protection

---

## Future Enhancements

- Google Analytics tracking
- reCAPTCHA spam protection
- Email notifications
- Thank you page redirect
- Multi-step form wizard
