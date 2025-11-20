# JP Auto Inventory Management System

A comprehensive cloud-based inventory management system for JP Auto dealership, featuring public vehicle submissions, admin dashboard, and automated exports to multiple platforms.

## Features

### Core Features
- **Public Vehicle Submission Form** - Customers can submit vehicles for sale (20-40 photos per submission)
- **Admin Dashboard** - Review submissions, manage inventory, and generate exports
- **OAuth Authentication** - Secure login via Google/Microsoft SSO
- **Image Processing** - Automatic resize, compression, and virus scanning
- **Cloud Storage** - Cloudflare R2 for scalable image hosting
- **PostgreSQL Database** - Robust data storage with full audit trail

### Export Capabilities
- **Jekyll Export** - Generate markdown files for your static website
- **Dealer Center** - CSV export for DMS integration
- **AutoTrader** - VAUTO XML format feed
- **CarGurus** - XML feed with full vehicle details
- **Facebook Marketplace** - CSV feed for social commerce

## Architecture

```
┌─────────────────┐
│   Public Form   │ (Customers submit vehicles)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL DB  │ (Master inventory database)
│   + R2 Storage  │ (Vehicle images)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Panel    │ (Review & manage inventory)
│  (OAuth Login)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Export Generators            │
├──────────┬──────────┬────────────────┤
│  Jekyll  │   DMS    │  Ad Providers  │
│   .md    │   CSV    │   XML/CSV      │
└──────────┴──────────┴────────────────┘
```

## Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (with Sequelize ORM)
- Passport.js (OAuth)
- Sharp (image processing)
- Cloudflare R2 (image storage)

**Frontend:**
- React (admin dashboard)
- React Hook Form
- TailwindCSS

**Hosting:**
- Railway (application + database)
- Cloudflare R2 (images)

**Estimated Monthly Cost:** $10-15/month

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or use Railway's managed PostgreSQL)
- Cloudflare account (for R2 storage)
- Google and/or Microsoft OAuth credentials

### Installation

1. **Clone and install dependencies:**
```bash
cd inventory-system
cd server && npm install
cd ../client && npm install
```

2. **Configure environment variables:**
```bash
cd server
cp .env.example .env
# Edit .env with your credentials
```

3. **Setup database:**
```bash
# Create PostgreSQL database
createdb jp_auto_inventory

# Run migrations
npm run db:migrate
```

4. **Start development servers:**
```bash
# Terminal 1 - Backend API
cd server
npm run dev

# Terminal 2 - Frontend (if using React admin)
cd client
npm start
```

5. **Access the application:**
- API: http://localhost:5000
- Admin Panel: http://localhost:3000

## Configuration

### Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

#### Required Settings
```env
DATABASE_URL=postgresql://user:password@localhost:5432/jp_auto_inventory
SESSION_SECRET=your-secret-key-here

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=jp-auto-inventory
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

#### OAuth Credentials

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable OAuth 2.0
3. Add authorized redirect: `https://your-domain.com/auth/google/callback`
4. Copy Client ID and Secret to `.env`

**Microsoft OAuth:**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register application → Add redirect URI
3. Copy Application ID and Secret to `.env`

### Cloudflare R2 Setup

1. **Create R2 Bucket:**
   - Go to Cloudflare Dashboard → R2
   - Create bucket: `jp-auto-inventory`
   - Enable public access

2. **Generate API Tokens:**
   - Create API token with R2 read/write permissions
   - Copy credentials to `.env`

3. **Configure Custom Domain (Optional):**
   - Add custom domain: `inventory-images.jpautomotivegroup.com`
   - Update `R2_PUBLIC_URL` in `.env`

## Usage Guide

### For Customers (Public Submission)

1. Navigate to `/submit`
2. Fill out vehicle information form
3. Upload 20-40 photos (max 10MB each)
4. Submit for review

### For Admins

#### Review Pending Submissions

1. Login to admin panel
2. Go to "Pending Submissions"
3. Review vehicle details and photos
4. Approve → Moves to inventory
5. Reject → Stays in submissions with reason

#### Manage Inventory

1. Add new vehicle manually
2. Edit existing vehicles
3. Mark as sold/hold
4. Delete vehicles

#### Generate Exports

**Jekyll Export (Website):**
```bash
# In admin panel: Exports → Jekyll → Generate
# Files written to: ../_vehicles/
# Commit and push to deploy website
```

**Dealer Center (DMS):**
```bash
# Exports → Dealer Center → Generate CSV
# Download and import to Dealer Center
```

**AutoTrader:**
```bash
# Exports → AutoTrader → Generate XML
# Upload to AutoTrader FTP or dashboard
```

**CarGurus:**
```bash
# Exports → CarGurus → Generate XML
# Upload to CarGurus inventory feed
```

**Facebook Marketplace:**
```bash
# Exports → Facebook → Generate CSV
# Upload to Facebook Business Manager
```

## API Endpoints

### Public Endpoints
- `POST /api/submissions` - Submit vehicle for sale
- `POST /api/submissions/:id/images` - Upload images

### Protected Endpoints (OAuth required)
- `GET /api/inventory` - List all inventory
- `POST /api/inventory` - Add vehicle
- `PUT /api/inventory/:id` - Update vehicle
- `DELETE /api/inventory/:id` - Delete vehicle
- `POST /api/exports/jekyll` - Export to Jekyll
- `POST /api/exports/dealer-center` - Export to Dealer Center
- `POST /api/exports/autotrader` - Export to AutoTrader
- `POST /api/exports/cargurus` - Export to CarGurus
- `POST /api/exports/facebook` - Export to Facebook

## Deployment

### Deploy to Railway

1. **Create Railway Project:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd server
railway init
```

2. **Add PostgreSQL:**
```bash
railway add postgresql
```

3. **Set Environment Variables:**
```bash
# In Railway dashboard, add all env vars from .env
```

4. **Deploy:**
```bash
railway up
```

5. **Configure Custom Domain:**
```bash
# In Railway dashboard: Settings → Domains
# Add: inventory.jpautomotivegroup.com
```

### Post-Deployment

1. Run database migrations
2. Create first admin user
3. Test OAuth logins
4. Test image upload
5. Generate test exports

## Database Schema

See `database/schema.sql` for complete schema.

**Main Tables:**
- `users` - OAuth users with roles
- `pending_submissions` - Customer vehicle submissions
- `inventory` - Approved vehicles for sale
- `export_logs` - Export history tracking
- `activity_logs` - Audit trail

## Security Features

- OAuth 2.0 authentication (no password storage)
- Role-based access control (admin, manager, viewer)
- Rate limiting on public endpoints
- CSRF protection
- Helmet.js security headers
- SQL injection protection (Sequelize ORM)
- Image virus scanning (optional ClamAV integration)
- File size limits
- Input validation and sanitization

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Verify credentials in .env
echo $DATABASE_URL
```

### Images Not Uploading
```bash
# Check R2 credentials
# Verify bucket is public
# Check file size limits in .env
```

### OAuth Not Working
```bash
# Verify callback URLs match exactly
# Check OAuth credentials
# Ensure HTTPS in production
```

### Export Errors
```bash
# Check file permissions
# Verify export paths exist
# Review export logs in database
```

## Development

### Run Tests
```bash
npm test
```

### Database Migrations
```bash
npm run db:migrate
```

### Seed Sample Data
```bash
npm run db:seed
```

### Reset Database
```bash
npm run db:reset
```

## Contributing

This is a private dealership system. For internal development:

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR for review

## Support

For issues or questions:
- Email: tech@jpautomotivegroup.com
- Internal documentation: `/docs`

## License

Proprietary - JP Auto Internal Use Only

---

**JP Auto Inventory Management System v1.0.0**
Built with ❤️ for JP Auto by Claude Code
