# JP Auto Admin Panel

Modern admin dashboard built with Solid.js, Tailwind CSS, and Material Design 3.

## Tech Stack

- **Framework**: Solid.js 1.9
- **Styling**: Tailwind CSS v4 with Material Design 3
- **Routing**: @solidjs/router
- **Build Tool**: Vite 7
- **Package Manager**: Bun
- **Hosting**: Cloudflare Pages

## Features

- ✅ Google OAuth authentication
- ✅ Material Design 3 UI components
- ✅ Dashboard with real-time stats
- ✅ Consignment submissions management
- ✅ Inventory management
- ✅ Data export functionality
- ✅ Responsive design

## Development

### Prerequisites

- Bun (latest version)
- Node.js 18+ (for compatibility)

### Setup

1. Install dependencies:
```bash
bun install
```

2. Start development server:
```bash
bun run dev
```

The app will be available at `http://localhost:3000`

## Deployment to Cloudflare Pages

### Initial Setup

1. **Push to GitHub** (if not already done):
```bash
git add admin-panel
git commit -m "Add Solid.js admin panel"
git push
```

2. **Create Cloudflare Pages Project**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** > **Create a project**
   - Connect your GitHub repository
   - Select the repository: `JP Auto Website`

3. **Configure Build Settings**:
   - **Project name**: `jp-auto-admin`
   - **Production branch**: `main` (or `master`)
   - **Framework preset**: `None` (manual configuration)
   - **Build command**: `cd admin-panel && bun install && bun run build`
   - **Build output directory**: `admin-panel/dist`
   - **Root directory**: `/` (leave as root)

4. **Environment Variables** (in Cloudflare Pages settings):
   ```
   VITE_API_URL=https://jp-auto-backend-production.up.railway.app
   ```

5. **Deploy**: Click **Save and Deploy**

### Custom Domain Setup

After deployment, set up custom domain:

1. Go to **Custom domains** in your Cloudflare Pages project
2. Add domain: `admin.jpautomotivegroup.com`
3. Cloudflare will automatically configure DNS

### Update Backend Configuration

Once deployed, update the Railway backend environment variables:

1. Go to [Railway Dashboard](https://railway.app/)
2. Select your backend project
3. Go to **Variables** tab
4. Update/Add:
   ```
   ADMIN_URL=https://admin.jpautomotivegroup.com
   ALLOWED_ORIGINS=http://localhost:3000,https://admin.jpautomotivegroup.com,https://consign.jpautomotivegroup.com,https://jp-auto-consignment.pages.dev
   ```

5. **Redeploy** the backend service to apply changes

### Google OAuth Configuration

Update Google Cloud Console OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://admin.jpautomotivegroup.com
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://jp-auto-backend-production.up.railway.app/auth/google/callback
   ```

## Project Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx    # Auth route wrapper
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication state
│   ├── pages/
│   │   ├── Login.jsx             # Login page
│   │   └── Dashboard.jsx         # Main dashboard
│   ├── services/
│   │   └── api.js                # API client
│   ├── App.jsx                   # Root component
│   ├── index.jsx                 # Entry point
│   └── index.css                 # Global styles + Material 3
├── public/
│   └── _redirects                # Cloudflare SPA routing
├── dist/                         # Build output (gitignored)
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## API Integration

The admin panel connects to the Railway backend API:

- **Base URL**: `https://jp-auto-backend-production.up.railway.app`
- **Auth**: `/auth/*` - Google OAuth
- **Submissions**: `/api/submissions` - Consignment submissions
- **Inventory**: `/api/inventory` - Vehicle inventory
- **Exports**: `/api/exports` - Data export

Authentication uses HTTP-only cookies with session management.

## Material Design 3

Custom Material 3 design system with:
- Orange primary color (#ff6b35)
- Elevation shadows
- Rounded components
- Interactive states
- Responsive breakpoints

See `tailwind.config.js` and `src/index.css` for full design tokens.

## License

Proprietary - JP Automotive Group
