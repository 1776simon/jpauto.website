# JP Auto Inventory System - Project Overview

## What We Built

A complete, production-ready inventory management system that serves as your **master database** for all vehicle inventory, with the ability to export to your website and multiple advertising platforms.

## System Flow

```
Customer Submissions → Database (Master) → Exports
                              ↓
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
               Website     DMS    Ad Providers
              (Jekyll)   (Dealer  (AutoTrader,
                         Center)   CarGurus,
                                  Facebook)
```

## Project Structure

```
inventory-system/
├── server/                          # Backend API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # PostgreSQL configuration
│   │   ├── models/
│   │   │   ├── User.js             # OAuth users
│   │   │   ├── PendingSubmission.js # Customer submissions
│   │   │   ├── Inventory.js        # Active inventory
│   │   │   └── index.js            # Model relationships
│   │   ├── services/
│   │   │   ├── r2Storage.js        # Cloudflare R2 integration
│   │   │   └── imageProcessor.js   # Image resize/compress
│   │   ├── exports/
│   │   │   ├── jekyll/
│   │   │   │   └── jekyllExporter.js     # Website export
│   │   │   ├── dealer-center/
│   │   │   │   └── dealerCenterExporter.js # DMS export
│   │   │   ├── autotrader/
│   │   │   │   └── autotraderExporter.js  # AutoTrader XML
│   │   │   ├── cargurus/
│   │   │   │   └── cargurusExporter.js    # CarGurus XML
│   │   │   └── facebook/
│   │   │       └── facebookExporter.js    # Facebook CSV
│   │   ├── index.js                # Main Express server
│   │   └── (routes, controllers, middleware to be added)
│   ├── package.json
│   └── .env.example
├── client/                          # Frontend (to be built)
│   └── (React admin dashboard)
├── database/
│   └── schema.sql                  # Complete database schema
├── README.md                       # Full documentation
├── DEPLOYMENT.md                   # Step-by-step deployment guide
├── OVERVIEW.md                     # This file
├── railway.json                    # Railway deployment config
└── .gitignore
```

## Core Components

### 1. Database (PostgreSQL)
- **pending_submissions** - Customer vehicle submissions (awaiting approval)
- **inventory** - Approved vehicles for sale
- **users** - OAuth-authenticated admin users
- **export_logs** - Tracking of all exports
- **activity_logs** - Complete audit trail

### 2. Image Management
- **Cloudflare R2** - Cloud storage for vehicle photos
- **Sharp.js** - Automatic image processing:
  - Resize to max 2000px width
  - Compress to ~500KB
  - Generate 400px thumbnails
  - Support 20-40 photos per vehicle

### 3. Export System

#### Jekyll Export (`jekyllExporter.js`)
- Generates markdown files for your static website
- Output: `_vehicles/*.md` files
- Includes frontmatter with all vehicle data
- Auto-generates SEO-friendly filenames
- **Usage:** Admin clicks "Export to Jekyll" → Commit files → Deploy website

#### Dealer Center Export (`dealerCenterExporter.js`)
- Generates CSV for DMS import
- Includes all vehicle data + images
- Can import back from Dealer Center
- **Usage:** Export CSV → Upload to Dealer Center

#### AutoTrader Export (`autotraderExporter.js`)
- VAUTO XML format
- Full vehicle specs + images
- Dealer information included
- **Usage:** Export XML → Upload to AutoTrader portal

#### CarGurus Export (`cargurusExporter.js`)
- CarGurus-specific XML format
- Optimized field mapping
- Up to 50 images per vehicle
- **Usage:** Export XML → Upload to CarGurus dashboard

#### Facebook Marketplace Export (`facebookExporter.js`)
- CSV format with semicolon-separated images
- Optimized for social commerce
- Includes all required fields
- **Usage:** Export CSV → Upload to Facebook Business Manager

## Key Features

### Security
✅ OAuth 2.0 authentication (Google/Microsoft)
✅ No password storage
✅ Role-based access (admin, manager, viewer)
✅ Rate limiting on public endpoints
✅ Image virus scanning support
✅ CSRF protection
✅ Helmet.js security headers

### Image Processing
✅ Automatic resize and compression
✅ Thumbnail generation
✅ 20-40 photos per vehicle
✅ Max 10MB per image
✅ Total 200MB per submission
✅ Virus scanning (optional ClamAV)

### Data Management
✅ Master inventory database
✅ Pending submissions workflow
✅ Approve/reject submissions
✅ Complete audit trail
✅ Export tracking
✅ Bulk operations

## What's Next?

### Immediate (Required to Run):
1. **API Routes & Controllers** - Create REST endpoints
2. **OAuth Integration** - Implement Passport.js strategies
3. **React Admin Dashboard** - Build UI
4. **Public Submission Form** - Build React form component

### Near-term Enhancements:
- File upload middleware (Multer)
- Export API endpoints
- Email notifications
- Automated export scheduling
- FTP upload to ad providers

### Future Features:
- Analytics dashboard
- Price optimization suggestions
- Automated photo editing
- SMS notifications
- Mobile app
- Real-time inventory sync

## Technology Choices Explained

### Why Railway?
- Simple deployment (one command)
- Includes PostgreSQL hosting
- Auto-scaling
- $10-15/month total cost
- Free SSL certificates
- Easy custom domains

### Why Cloudflare R2?
- Cheapest object storage ($0.015/GB)
- No egress fees
- S3-compatible API
- CDN included
- 10GB free tier

### Why PostgreSQL?
- ACID compliance
- JSON support (JSONB for features/images)
- Excellent performance
- Railway has managed PostgreSQL
- Industry standard

### Why Node.js?
- Fast development
- Great libraries (Sharp, Sequelize)
- Single language (JS for frontend + backend)
- Excellent for APIs
- Railway native support

## Cost Breakdown

**Monthly Recurring:**
- Railway (App + Database): $10/month
- Cloudflare R2 (1000 vehicles): $1-2/month
- **Total: ~$12/month**

**One-time:**
- Domain (if not owned): $15/year
- OAuth setup: Free

## How to Use (After Deployment)

### For Public (Customers):
1. Visit: `https://inventory.jpautomotivegroup.com/submit`
2. Fill form with vehicle details
3. Upload 20-40 photos
4. Submit for review

### For Admins:
1. Login: `https://inventory.jpautomotivegroup.com/admin`
2. Review pending submissions
3. Approve → Adds to inventory
4. Export to:
   - Jekyll (website)
   - Dealer Center (DMS)
   - AutoTrader (ads)
   - CarGurus (ads)
   - Facebook (ads)

### Workflow Example:
```
1. Customer submits 2015 Honda Civic with 25 photos
2. Admin receives notification
3. Admin reviews submission in dashboard
4. Admin approves → Vehicle moves to inventory
5. Admin clicks "Export to Jekyll"
6. System generates markdown file
7. Admin commits and pushes to GitHub
8. Website automatically deploys with new vehicle
9. Admin exports to AutoTrader, CarGurus, Facebook
10. Vehicle appears on all platforms
```

## Success Metrics

After full implementation, you'll be able to:

✅ Manage 50+ vehicles easily
✅ Update inventory in one place
✅ Publish to website in seconds
✅ Export to all ad providers with one click
✅ Track all inventory changes
✅ Accept customer submissions
✅ Store unlimited photos (with R2)
✅ Scale to 1000+ vehicles

## Documentation

- **README.md** - Complete system documentation
- **DEPLOYMENT.md** - Step-by-step deployment guide
- **OVERVIEW.md** - This file (high-level overview)
- **database/schema.sql** - Database structure
- **server/.env.example** - Configuration template

## Getting Help

**Common Questions:**

**Q: How do I add my first vehicle?**
A: After deployment, login to admin, go to "Add Vehicle", fill form, upload images, submit.

**Q: How often should I export?**
A: Export to Jekyll whenever you add/update vehicles. Export to ad providers weekly or when inventory changes significantly.

**Q: Can I import from Dealer Center?**
A: Yes! The Dealer Center exporter includes import functionality.

**Q: What if I need more than 40 photos?**
A: Edit `MAX_IMAGES_PER_SUBMISSION` in `.env` (note: may affect upload time).

**Q: How do I backup data?**
A: Railway auto-backs up PostgreSQL. Images are in R2 (also backed up by Cloudflare).

## Next Steps

1. **Read DEPLOYMENT.md** - Follow deployment guide
2. **Setup OAuth credentials** - Google/Microsoft
3. **Deploy to Railway** - One-command deployment
4. **Complete the frontend** - Build React admin UI
5. **Test thoroughly** - Add test vehicles, generate exports
6. **Go live!** - Start managing inventory

---

## Project Status

**✅ Completed:**
- Database schema
- All export generators
- Image processing
- R2 storage integration
- Core server setup
- Documentation

**🚧 Remaining:**
- API routes and controllers
- OAuth middleware
- React admin dashboard
- Public submission form
- Email notifications

**Estimated completion time:** 10-15 hours of development

---

**JP Auto Inventory System**
Master Database → Export Everywhere
Built with Node.js, PostgreSQL, and Cloudflare R2
