# JP Auto Admin Dashboard

Modern React admin dashboard for managing vehicle inventory, submissions, and exports.

## Features

- **Google OAuth Authentication** - Secure admin login
- **Dashboard Home** - Statistics and quick actions
- **Submissions Management** - Approve/reject consignment submissions
- **Inventory Viewing** - Browse all vehicles in inventory
- **Jekyll Export** - Download vehicle data for static website
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Live data from Railway backend

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Railway API** - Backend integration

## Development

### Prerequisites

- Node.js 18+ installed
- Access to JP Auto Railway backend
- Admin Google account configured in backend

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Update `.env` with your API URL:
```env
VITE_API_URL=https://jp-auto-inventory-production.up.railway.app
```

4. Start development server:
```bash
npm run dev
```

5. Open browser to `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
```

## Deployment to Cloudflare Pages

### Step 1: Build the Project

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Step 2: Deploy to Cloudflare Pages

#### Option A: GitHub Integration (Recommended)

1. **Push to GitHub:**
```bash
git add admin-dashboard
git commit -m "Add admin dashboard"
git push
```

2. **Create Cloudflare Pages Project:**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect your GitHub repository
   - Select repository: `JP Auto Website`
   - Configure build:
     ```
     Build command:     cd admin-dashboard && npm install && npm run build
     Build output dir:  admin-dashboard/dist
     Root directory:    /
     ```

3. **Add Environment Variable:**
   - Go to Settings → Environment variables
   - Add variable:
     ```
     VITE_API_URL = https://jp-auto-inventory-production.up.railway.app
     ```
   - Apply to: Production & Preview

4. **Deploy:**
   - Click "Save and Deploy"
   - Wait 2-3 minutes for build
   - Get deployment URL (e.g., `jp-auto-admin.pages.dev`)

#### Option B: Direct Upload

```bash
npm install -g wrangler
wrangler login
cd admin-dashboard
npm run build
wrangler pages deploy dist --project-name=jp-auto-admin
```

### Step 3: Configure Custom Domain

1. **Add Custom Domain:**
   - In Cloudflare Pages project settings
   - Custom domains → Set up a custom domain
   - Enter: `admin.jpautomotivegroup.com`
   - Follow DNS instructions

2. **Update CORS on Backend:**
   - Add `admin.jpautomotivegroup.com` to allowed origins in Railway backend
   - File: `inventory-system/server/src/index.js`
   - Add to CORS configuration

3. **Update OAuth Redirect:**
   - Go to Google Cloud Console
   - Add authorized redirect URI:
     ```
     https://admin.jpautomotivegroup.com/dashboard
     ```

## Project Structure

```
admin-dashboard/
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx      # Authentication state management
│   ├── services/
│   │   └── api.js                # API service layer
│   ├── App.jsx                   # Main application with all pages
│   ├── App.css                   # Custom styles
│   ├── index.css                 # Tailwind imports
│   └── main.jsx                  # React entry point
├── public/                       # Static assets
├── .env                          # Environment variables (not committed)
├── .env.example                  # Environment template
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS configuration
└── vite.config.js                # Vite configuration
```

## Pages

### Login (`/login`)
- Google OAuth authentication
- Redirects to dashboard after login
- Protected route handling

### Dashboard Home (`/dashboard`)
- Statistics cards (pending submissions, inventory count, featured vehicles)
- Quick action links
- Overview metrics

### Submissions (`/dashboard/submissions`)
- Filter by status (all, pending, approved, rejected)
- Expandable submission cards
- Approve/reject actions
- Contact information display

### Inventory (`/dashboard/inventory`)
- Grid view of all vehicles
- Vehicle details (price, mileage, features)
- Featured vehicle badges
- Image display

### Exports (`/dashboard/exports`)
- Jekyll export download
- Instructions and file details
- One-click export to ZIP

## Authentication Flow

1. User visits dashboard → redirected to `/login`
2. Click "Sign in with Google" → redirects to Railway backend
3. Backend authenticates with Google OAuth
4. Backend redirects back to dashboard with session cookie
5. Dashboard checks `/auth/status` endpoint
6. If authenticated, show dashboard; otherwise, show login

## API Integration

### Authentication
- `GET /auth/status` - Check authentication status
- `GET /auth/google` - Initiate Google OAuth
- `POST /auth/logout` - Logout user

### Submissions
- `GET /api/submissions?status=pending` - Get submissions
- `POST /api/submissions/:id/approve` - Approve submission
- `POST /api/submissions/:id/reject` - Reject submission

### Inventory
- `GET /api/inventory` - Get all vehicles
- `GET /api/inventory/stats` - Get inventory statistics

### Exports
- `GET /api/exports/jekyll` - Download Jekyll ZIP

## Troubleshooting

### Login Issues

**Problem:** OAuth redirect fails or loops
**Solution:**
1. Check `VITE_API_URL` in `.env`
2. Verify Railway backend has your domain in CORS
3. Check Google Cloud Console has correct redirect URI

### API Connection Issues

**Problem:** "Failed to fetch" or CORS errors
**Solution:**
1. Verify Railway backend is running
2. Check CORS configuration includes admin domain
3. Ensure `credentials: 'include'` in API calls

### Build Issues

**Problem:** Build fails with Tailwind errors
**Solution:**
```bash
rm -rf node_modules
npm install
npm run build
```

### Production Environment Issues

**Problem:** API calls work locally but not in production
**Solution:**
1. Check environment variables in Cloudflare Pages
2. Verify `VITE_API_URL` is set correctly
3. Rebuild and redeploy

## Security Notes

- **Authentication Required**: All dashboard pages require Google OAuth
- **Admin-Only Access**: Backend validates admin users via Google OAuth
- **Secure Cookies**: Sessions use httpOnly, secure cookies
- **CORS Protection**: Backend only allows specific origins
- **Environment Variables**: Never commit `.env` file

## License

Proprietary - JP Auto
