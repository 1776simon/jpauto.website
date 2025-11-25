# JP Auto - DealerCenter Integration & Photo Management Implementation Plan

## Executive Summary

This plan details the implementation of:
1. Fuel Type dropdowns across all inventory input points
2. Enhanced DealerCenter export with proper dealer information
3. Photo upload and drag-and-drop reordering system
4. LatestPhotoModified tracking
5. Automated FTP upload for daily exports

**Estimated Time:** 2-3 days of development + testing
**Risk Level:** Medium (photo management is complex, FTP requires infrastructure)

---

## Phase 1: Fuel Type Integration (Low Risk, 2-3 hours)

### 1.1 Backend - Verify Database & API (Already Done ✓)
**Status:** Fuel Type field already exists in database model

**Verification Needed:**
```bash
# Check if PendingSubmission model also has fuelType
File: inventory-system/server/src/models/PendingSubmission.js
```

**Action Items:**
- [ ] Verify PendingSubmission model has fuelType field
- [ ] If missing, add database migration
- [ ] Ensure API endpoints accept/return fuelType

---

### 1.2 Consignment Form - Add Fuel Type Dropdown

**File:** `consignment-form/index.html`

**Location to Add:** After transmission field (around line ~150-200 in the form)

**HTML to Add:**
```html
<!-- Fuel Type -->
<div class="form-group">
    <label for="fuelType" class="form-label">
        Fuel Type <span class="required">*</span>
    </label>
    <select
        id="fuelType"
        name="fuelType"
        class="form-input"
        required
    >
        <option value="">Select fuel type...</option>
        <option value="Gasoline">Gasoline</option>
        <option value="Diesel">Diesel</option>
        <option value="Electric">Electric</option>
        <option value="Hybrid">Hybrid</option>
    </select>
    <div class="error-message" id="fuelTypeError"></div>
</div>
```

**JavaScript Changes:**
```javascript
// In the form submission function, add:
const formData = {
    // ... existing fields ...
    fuelType: document.getElementById('fuelType').value,
    // ... rest of fields ...
};

// In validation function, add:
if (!formData.fuelType) {
    errors.push({ field: 'fuelType', message: 'Fuel type is required' });
}
```

**Deployment:**
- Commit to GitHub
- Cloudflare Pages auto-deploys to https://consign.jpautomotivegroup.com

---

### 1.3 Admin Panel - Submissions Page

**File:** `admin-panel/src/pages/Submissions.tsx`

**Changes Needed:**

1. **Display in submission cards** (around line 280-320):
```typescript
// Add after transmission display
<div className="flex justify-between">
  <span className="text-muted-foreground">Fuel Type:</span>
  <span className="font-medium text-foreground">
    {submission.fuelType || 'N/A'}
  </span>
</div>
```

2. **Display in detail modal** (around line 470-520):
```typescript
// In Vehicle Details section, add:
<div>
  <span className="text-muted-foreground">Fuel Type:</span>
  <p className="font-medium text-foreground">
    {selectedSubmission.fuelType || 'N/A'}
  </p>
</div>
```

---

### 1.4 Admin Panel - Inventory Edit Popup

**File:** `admin-panel/src/pages/Inventory.tsx`

**Changes Needed:**

1. **Add to editFormData initialization** (around line 120-130):
```typescript
setEditFormData({
  // ... existing fields ...
  fuelType: item.fuelType || item.fuel_type || '',
  // ... rest of fields ...
});
```

2. **Add dropdown in edit form** (after transmission field, around line 590-600):
```typescript
<div>
  <label className="block text-sm font-medium text-foreground mb-2">
    Fuel Type
  </label>
  <select
    value={editFormData.fuelType || ''}
    onChange={(e) => setEditFormData({ ...editFormData, fuelType: e.target.value })}
    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
  >
    <option value="">Select...</option>
    <option value="Gasoline">Gasoline</option>
    <option value="Diesel">Diesel</option>
    <option value="Electric">Electric</option>
    <option value="Hybrid">Hybrid</option>
  </select>
</div>
```

3. **Display in View mode** (around line 760-770):
```typescript
<div>
  <span className="text-muted-foreground">Fuel Type:</span>
  <p className="font-medium text-foreground">
    {selectedItem.fuelType || selectedItem.fuel_type || 'N/A'}
  </p>
</div>
```

---

## Phase 2: DealerCenter Export Configuration (Medium Risk, 2-3 hours)

### 2.1 Create DealerCenter Config File

**New File:** `inventory-system/server/src/config/dealerCenter.js`

```javascript
/**
 * DealerCenter Configuration
 * JP Automotive Group LLC
 */

module.exports = {
  // Dealer Information
  dealerId: '29007654',
  dealerName: 'JP Automotive Group LLC',

  // Address (VERIFY THESE VALUES)
  address: '123 Main Street', // TODO: Verify actual address
  city: 'City Name',          // TODO: Verify
  state: 'State',             // TODO: Verify
  zip: '00000',               // TODO: Verify
  phone: '(000) 000-0000',    // TODO: Verify actual phone

  // Export Settings
  stockNumberFormat: 'vin_last_8', // Leave blank, let DealerCenter auto-populate
  imageDelimiter: ';', // Semicolon-separated image URLs

  // FTP Settings (will be environment variables)
  ftp: {
    host: process.env.DEALERCENTER_FTP_HOST,
    port: process.env.DEALERCENTER_FTP_PORT || 21,
    user: process.env.DEALERCENTER_FTP_USER,
    password: process.env.DEALERCENTER_FTP_PASSWORD,
    remotePath: process.env.DEALERCENTER_FTP_PATH || '/uploads/',
    secure: process.env.DEALERCENTER_FTP_SECURE === 'true'
  }
};
```

**Action Items:**
- [ ] Verify dealer address from existing config or ask user
- [ ] Verify phone number
- [ ] Update values in config file

---

### 2.2 Update DealerCenter Exporter

**File:** `inventory-system/server/src/exports/dealer-center/dealerCenterExporter.js`

**Changes Required:**

1. **Import config** (top of file):
```javascript
const dealerCenterConfig = require('../../config/dealerCenter');
```

2. **Replace generateDealerCenterCSV function** (lines 40-157):
```javascript
const generateDealerCenterCSV = (vehicles) => {
  // Map vehicles to DealerCenter import format
  const dealerCenterVehicles = vehicles.map(vehicle => ({
    // Dealer Information (constant for all rows)
    'DealerID': dealerCenterConfig.dealerId,
    'DealerName': dealerCenterConfig.dealerName,
    'Address': dealerCenterConfig.address,
    'City': dealerCenterConfig.city,
    'State': dealerCenterConfig.state,
    'Zip': dealerCenterConfig.zip,
    'Phone': dealerCenterConfig.phone,

    // Stock Number - Leave blank, DealerCenter auto-populates with last 8 of VIN
    'StockNumber': '',

    // Vehicle Identification
    'VIN': vehicle.vin,
    'Year': vehicle.year,
    'Make': vehicle.make,
    'Model': vehicle.model,
    'Trim': vehicle.trim || '',

    // Vehicle Details
    'Odometer': vehicle.mileage,
    'Price': Math.round(vehicle.price),
    'Exterior Color': vehicle.exteriorColor || '',
    'InteriorColor': vehicle.interiorColor || '',
    'Transmission': vehicle.transmission || '',
    'FuelType': vehicle.fuelType || '',

    // Photos - Semicolon-separated URLs
    'PhotoURLs': vehicle.images && vehicle.images.length > 0
      ? vehicle.images.join(';')
      : '',

    // Marketing (leave blank for now)
    'WebAdDescription': '',
    'VDP': '', // Vehicle Detail Page URL - will add later

    // Description
    'Description': vehicle.description || '',

    // Photo Modified Date
    'LatestPhotoModifiedDate': formatPhotoModifiedDate(
      vehicle.latestPhotoModified || vehicle.createdAt
    )
  }));

  // Define CSV fields in exact order from DealerCenter template
  const fields = [
    'DealerID',
    'DealerName',
    'Address',
    'City',
    'State',
    'Zip',
    'Phone',
    'StockNumber',
    'VIN',
    'Year',
    'Make',
    'Model',
    'Trim',
    'Odometer',
    'Price',
    'Exterior Color',
    'InteriorColor',
    'Transmission',
    'PhotoURLs',
    'WebAdDescription',
    'VDP',
    'FuelType',
    'Description',
    'LatestPhotoModifiedDate'
  ];

  const csv = parse(dealerCenterVehicles, { fields });
  return csv;
};

/**
 * Format photo modified date for DealerCenter
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date (YYYY-MM-DD or as required)
 */
const formatPhotoModifiedDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
};
```

3. **Export new function**:
```javascript
module.exports = {
  exportToDealerCenter,
  generateDealerCenterCSV,
  importFromDealerCenter,
  generateImportTemplate,
  formatPhotoModifiedDate // Add this
};
```

---

## Phase 3: Database Schema Updates for Photo Tracking (Medium Risk, 1 hour)

### 3.1 Add latestPhotoModified Field

**New File:** `inventory-system/server/migrations/YYYYMMDDHHMMSS-add-latest-photo-modified.js`

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('inventory', 'latest_photo_modified', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of last photo addition/removal/reordering'
    });

    // Set default value to created_at for existing records
    await queryInterface.sequelize.query(`
      UPDATE inventory
      SET latest_photo_modified = created_at
      WHERE latest_photo_modified IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('inventory', 'latest_photo_modified');
  }
};
```

### 3.2 Update Inventory Model

**File:** `inventory-system/server/src/models/Inventory.js`

**Add after line 141 (after primaryImageUrl):**
```javascript
  latestPhotoModified: {
    type: DataTypes.DATE,
    field: 'latest_photo_modified',
    comment: 'Timestamp of last photo addition/removal/reordering'
  },
```

---

## Phase 4: Photo Upload & Management API (High Risk, 4-6 hours)

### 4.1 Add Photo Management Endpoints

**File:** `inventory-system/server/src/routes/inventory.js`

**New endpoints to add:**

```javascript
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/inventory/:id/photos
 * Upload photos to existing inventory item
 */
router.post('/:id/photos',
  authMiddleware.requireAuth,
  upload.array('photos', 10),
  async (req, res) => {
    try {
      const { id } = req.params;
      const vehicle = await Inventory.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Upload images to R2
      const r2Storage = require('../services/r2Storage');
      const imageProcessor = require('../services/imageProcessor');

      const uploadedUrls = [];

      for (const file of req.files) {
        // Process and compress image
        const processedBuffer = await imageProcessor.processImage(file.buffer);

        // Generate unique filename
        const filename = `inventory/${id}/${Date.now()}-${file.originalname}`;

        // Upload to R2
        const url = await r2Storage.uploadFile(
          processedBuffer,
          filename,
          file.mimetype
        );

        uploadedUrls.push(url);
      }

      // Add new URLs to existing images array
      const currentImages = vehicle.images || [];
      const updatedImages = [...currentImages, ...uploadedUrls];

      // Update vehicle with new images and photo modified timestamp
      await vehicle.update({
        images: updatedImages,
        latestPhotoModified: new Date()
      });

      res.json({
        success: true,
        images: updatedImages,
        newImages: uploadedUrls,
        latestPhotoModified: vehicle.latestPhotoModified
      });

    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PUT /api/inventory/:id/photos/reorder
 * Reorder photos for inventory item
 */
router.put('/:id/photos/reorder',
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { images } = req.body; // Array of image URLs in new order

      if (!Array.isArray(images)) {
        return res.status(400).json({ error: 'Images must be an array' });
      }

      const vehicle = await Inventory.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Validate that all URLs exist in current images
      const currentImages = vehicle.images || [];
      const allValid = images.every(url => currentImages.includes(url));

      if (!allValid) {
        return res.status(400).json({
          error: 'Invalid image URLs provided'
        });
      }

      // Update with reordered images and photo modified timestamp
      await vehicle.update({
        images: images,
        latestPhotoModified: new Date()
      });

      res.json({
        success: true,
        images: vehicle.images,
        latestPhotoModified: vehicle.latestPhotoModified
      });

    } catch (error) {
      console.error('Photo reorder error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/inventory/:id/photos
 * Delete specific photo(s) from inventory item
 */
router.delete('/:id/photos',
  authMiddleware.requireAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { imageUrls } = req.body; // Array of image URLs to delete

      if (!Array.isArray(imageUrls)) {
        return res.status(400).json({ error: 'imageUrls must be an array' });
      }

      const vehicle = await Inventory.findByPk(id);

      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Remove specified URLs from images array
      const currentImages = vehicle.images || [];
      const updatedImages = currentImages.filter(
        url => !imageUrls.includes(url)
      );

      // Update vehicle with remaining images and photo modified timestamp
      await vehicle.update({
        images: updatedImages,
        latestPhotoModified: new Date()
      });

      // TODO: Optionally delete actual files from R2 storage
      // const r2Storage = require('../services/r2Storage');
      // for (const url of imageUrls) {
      //   await r2Storage.deleteFile(url);
      // }

      res.json({
        success: true,
        images: vehicle.images,
        deletedCount: imageUrls.length,
        latestPhotoModified: vehicle.latestPhotoModified
      });

    } catch (error) {
      console.error('Photo delete error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## Phase 5: Frontend Photo Management UI (High Risk, 6-8 hours)

### 5.1 Update API Service

**File:** `admin-panel/src/services/api.ts`

**Add new methods:**
```typescript
// Add to ApiService class

async uploadInventoryPhotos(id: number, files: FileList): Promise<{
  success: boolean;
  images: string[];
  newImages: string[];
  latestPhotoModified: string;
}> {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('photos', files[i]);
  }

  const url = `${API_URL}/api/inventory/${id}/photos`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData // Don't set Content-Type, browser will set it with boundary
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Failed to upload photos');
  }

  return await response.json();
}

async reorderInventoryPhotos(id: number, images: string[]): Promise<{
  success: boolean;
  images: string[];
  latestPhotoModified: string;
}> {
  return this.request(`/api/inventory/${id}/photos/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ images })
  });
}

async deleteInventoryPhotos(id: number, imageUrls: string[]): Promise<{
  success: boolean;
  images: string[];
  deletedCount: number;
  latestPhotoModified: string;
}> {
  return this.request(`/api/inventory/${id}/photos`, {
    method: 'DELETE',
    body: JSON.stringify({ imageUrls })
  });
}
```

---

### 5.2 Update Inventory Page with Photo Management

**File:** `admin-panel/src/pages/Inventory.tsx`

**Required npm packages:**
```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
# or
bun add react-beautiful-dnd @types/react-beautiful-dnd
```

**State additions (around line 30):**
```typescript
const [uploadingPhotos, setUploadingPhotos] = useState(false);
const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
```

**Add upload mutation:**
```typescript
// After updateMutation (around line 75)
const uploadPhotosMutation = useMutation({
  mutationFn: ({ id, files }: { id: number; files: FileList }) =>
    api.uploadInventoryPhotos(id, files),
  onSuccess: (data) => {
    // Update the selectedItem with new images
    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        images: data.images
      });
    }
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    toast.success(`${data.newImages.length} photo(s) uploaded successfully`);
    setUploadingPhotos(false);
  },
  onError: (error: Error) => {
    toast.error(`Failed to upload photos: ${error.message}`);
    setUploadingPhotos(false);
  },
});

const reorderPhotosMutation = useMutation({
  mutationFn: ({ id, images }: { id: number; images: string[] }) =>
    api.reorderInventoryPhotos(id, images),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    toast.success("Photo order updated");
  },
  onError: (error: Error) => {
    toast.error(`Failed to reorder photos: ${error.message}`);
  },
});

const deletePhotosMutation = useMutation({
  mutationFn: ({ id, imageUrls }: { id: number; imageUrls: string[] }) =>
    api.deleteInventoryPhotos(id, imageUrls),
  onSuccess: (data) => {
    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        images: data.images
      });
    }
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    toast.success(`${data.deletedCount} photo(s) deleted`);
  },
  onError: (error: Error) => {
    toast.error(`Failed to delete photos: ${error.message}`);
  },
});
```

**Photo upload handler:**
```typescript
const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || !selectedItem) return;

  const files = e.target.files;

  // Validate file count
  if (files.length > 10) {
    toast.error('Maximum 10 photos can be uploaded at once');
    return;
  }

  // Validate file sizes
  let totalSize = 0;
  for (let i = 0; i < files.length; i++) {
    if (files[i].size > 10 * 1024 * 1024) {
      toast.error(`File ${files[i].name} is too large (max 10MB)`);
      return;
    }
    totalSize += files[i].size;
  }

  setUploadingPhotos(true);
  uploadPhotosMutation.mutate({
    id: selectedItem.id as number,
    files
  });
};

const handlePhotoDelete = (imageUrl: string) => {
  if (!selectedItem) return;

  if (confirm('Are you sure you want to delete this photo?')) {
    deletePhotosMutation.mutate({
      id: selectedItem.id as number,
      imageUrls: [imageUrl]
    });
  }
};

const handlePhotoReorder = (reorderedImages: string[]) => {
  if (!selectedItem) return;

  // Update local state immediately for smooth UX
  setSelectedItem({
    ...selectedItem,
    images: reorderedImages
  });
};

const handleSavePhotoOrder = () => {
  if (!selectedItem) return;

  reorderPhotosMutation.mutate({
    id: selectedItem.id as number,
    images: selectedItem.images
  });
};
```

**Add imports for drag-and-drop:**
```typescript
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
```

**Add photo management section in Edit mode** (around line 630, before Action Buttons):
```typescript
{/* Photo Management */}
<div>
  <h3 className="font-semibold text-foreground mb-4">Photos</h3>

  {/* Upload Button */}
  <div className="mb-4">
    <input
      type="file"
      id="photoUpload"
      multiple
      accept="image/*"
      onChange={handlePhotoUpload}
      className="hidden"
      disabled={uploadingPhotos}
    />
    <label
      htmlFor="photoUpload"
      className={`m3-button-outlined inline-flex items-center justify-center gap-2 cursor-pointer ${
        uploadingPhotos ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <Plus className="w-5 h-5" />
      {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
    </label>
    <p className="text-xs text-muted-foreground mt-2">
      Max 10 photos per upload, 10MB per photo
    </p>
  </div>

  {/* Drag and Drop Photo Grid */}
  {selectedItem.images && selectedItem.images.length > 0 && (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        Drag photos to reorder. Changes save when you click "Save Changes".
      </p>
      <DragDropContext
        onDragEnd={(result: DropResult) => {
          if (!result.destination || !selectedItem.images) return;

          const items = Array.from(selectedItem.images);
          const [reorderedItem] = items.splice(result.source.index, 1);
          items.splice(result.destination.index, 0, reorderedItem);

          handlePhotoReorder(items);
        }}
      >
        <Droppable droppableId="photos" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
            >
              {selectedItem.images.map((img, idx) => (
                <Draggable key={img} draggableId={img} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`relative group ${
                        snapshot.isDragging ? 'opacity-50' : ''
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-border"
                      />
                      {/* Photo number badge */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {idx + 1}
                      </div>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handlePhotoDelete(img)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )}
</div>
```

---

## Phase 6: FTP Upload System (Medium Risk, 3-4 hours)

### 6.1 Install FTP Package

```bash
cd inventory-system/server
npm install basic-ftp
# or
yarn add basic-ftp
```

### 6.2 Create FTP Service

**New File:** `inventory-system/server/src/services/ftpService.js`

```javascript
const ftp = require('basic-ftp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');
const dealerCenterConfig = require('../config/dealerCenter');

/**
 * Upload file to DealerCenter FTP
 * @param {string} localFilePath - Path to local file
 * @param {string} remoteFileName - Name for remote file
 * @returns {Promise<boolean>} - Success status
 */
const uploadToDealerCenter = async (localFilePath, remoteFileName = null) => {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === 'development';

  try {
    // Connect to FTP server
    await client.access({
      host: dealerCenterConfig.ftp.host,
      port: dealerCenterConfig.ftp.port,
      user: dealerCenterConfig.ftp.user,
      password: dealerCenterConfig.ftp.password,
      secure: dealerCenterConfig.ftp.secure
    });

    logger.info('Connected to DealerCenter FTP');

    // Navigate to remote path
    await client.ensureDir(dealerCenterConfig.ftp.remotePath);

    // Generate remote filename if not provided
    if (!remoteFileName) {
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      remoteFileName = `jp-auto-inventory-${timestamp}.csv`;
    }

    // Upload file
    const remotePath = path.posix.join(
      dealerCenterConfig.ftp.remotePath,
      remoteFileName
    );

    await client.uploadFrom(localFilePath, remotePath);

    logger.info(`File uploaded to DealerCenter: ${remotePath}`);

    return true;

  } catch (error) {
    logger.error('FTP upload failed:', error);
    throw new Error(`FTP upload failed: ${error.message}`);
  } finally {
    client.close();
  }
};

/**
 * Test FTP connection
 * @returns {Promise<boolean>} - Connection success
 */
const testConnection = async () => {
  const client = new ftp.Client();

  try {
    await client.access({
      host: dealerCenterConfig.ftp.host,
      port: dealerCenterConfig.ftp.port,
      user: dealerCenterConfig.ftp.user,
      password: dealerCenterConfig.ftp.password,
      secure: dealerCenterConfig.ftp.secure
    });

    logger.info('FTP connection test successful');
    return true;

  } catch (error) {
    logger.error('FTP connection test failed:', error);
    return false;
  } finally {
    client.close();
  }
};

module.exports = {
  uploadToDealerCenter,
  testConnection
};
```

---

### 6.3 Create Daily Export Job

**New File:** `inventory-system/server/src/jobs/dailyDealerCenterExport.js`

```javascript
const cron = require('node-cron');
const { exportToDealerCenter } = require('../exports/dealer-center/dealerCenterExporter');
const { uploadToDealerCenter } = require('../services/ftpService');
const Inventory = require('../models/Inventory');
const logger = require('../config/logger');

/**
 * Daily DealerCenter export and FTP upload
 * Runs every day at 2:00 AM
 */
const scheduleDailyExport = () => {
  // Schedule: Every day at 2:00 AM
  // Format: minute hour day month weekday
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting daily DealerCenter export...');

      // Get all available inventory
      const vehicles = await Inventory.findAll({
        where: {
          status: 'available'
        },
        order: [['createdAt', 'DESC']]
      });

      if (vehicles.length === 0) {
        logger.info('No vehicles to export');
        return;
      }

      // Export to CSV
      const result = await exportToDealerCenter(vehicles);
      logger.info(`Exported ${result.vehicleCount} vehicles to ${result.filePath}`);

      // Upload via FTP
      const timestamp = new Date().toISOString().split('T')[0];
      const remoteFileName = `jp-auto-inventory-${timestamp}.csv`;

      await uploadToDealerCenter(result.filePath, remoteFileName);
      logger.info('Successfully uploaded to DealerCenter FTP');

      // Update export tracking
      await Inventory.update(
        {
          exportedToDealerCenter: true,
          exportedToDealerCenterAt: new Date()
        },
        {
          where: {
            id: vehicles.map(v => v.id)
          }
        }
      );

      logger.info('Daily DealerCenter export completed successfully');

    } catch (error) {
      logger.error('Daily DealerCenter export failed:', error);
      // TODO: Send alert email to admin
    }
  });

  logger.info('Daily DealerCenter export job scheduled (2:00 AM daily)');
};

/**
 * Manual export trigger (for testing or on-demand)
 */
const triggerManualExport = async () => {
  try {
    logger.info('Starting manual DealerCenter export...');

    const vehicles = await Inventory.findAll({
      where: {
        status: 'available'
      },
      order: [['createdAt', 'DESC']]
    });

    const result = await exportToDealerCenter(vehicles);
    await uploadToDealerCenter(result.filePath);

    return {
      success: true,
      vehicleCount: result.vehicleCount,
      filePath: result.filePath
    };

  } catch (error) {
    logger.error('Manual export failed:', error);
    throw error;
  }
};

module.exports = {
  scheduleDailyExport,
  triggerManualExport
};
```

**Install cron package:**
```bash
npm install node-cron
# or
yarn add node-cron
```

---

### 6.4 Initialize Job in Server

**File:** `inventory-system/server/src/index.js`

**Add near the end, before server.listen:**
```javascript
// Import job scheduler
const { scheduleDailyExport } = require('./jobs/dailyDealerCenterExport');

// Schedule daily export job
if (process.env.NODE_ENV === 'production') {
  scheduleDailyExport();
  logger.info('Daily export job initialized');
}
```

---

### 6.5 Add Manual Export API Endpoint

**File:** `inventory-system/server/src/routes/exports.js`

**Add endpoint:**
```javascript
const { triggerManualExport } = require('../jobs/dailyDealerCenterExport');

/**
 * POST /api/exports/dealer-center/trigger
 * Manually trigger DealerCenter export and FTP upload
 */
router.post('/dealer-center/trigger', async (req, res) => {
  try {
    const result = await triggerManualExport();

    res.json({
      success: true,
      message: 'Export and FTP upload completed successfully',
      vehicleCount: result.vehicleCount
    });

  } catch (error) {
    res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
});
```

---

## Phase 7: Environment Variables & Configuration

### 7.1 Required Environment Variables

**File:** `inventory-system/server/.env` (add these)

```bash
# DealerCenter FTP Configuration
DEALERCENTER_FTP_HOST=ftp.dealercenter.com
DEALERCENTER_FTP_PORT=21
DEALERCENTER_FTP_USER=your_ftp_username
DEALERCENTER_FTP_PASSWORD=your_ftp_password
DEALERCENTER_FTP_PATH=/uploads/
DEALERCENTER_FTP_SECURE=false

# Note: Get actual FTP credentials from DealerCenter
```

### 7.2 Railway Environment Variables

**To set in Railway dashboard:**
1. Go to https://railway.app (your project)
2. Navigate to Variables
3. Add all DEALERCENTER_FTP_* variables
4. Redeploy

---

## Phase 8: Testing Strategy

### 8.1 Unit Tests

**Backend:**
- [ ] Test DealerCenter CSV generation with sample data
- [ ] Test photo upload API with mock files
- [ ] Test photo reorder API
- [ ] Test photo delete API
- [ ] Test FTP connection (use test credentials)

**Frontend:**
- [ ] Test Fuel Type dropdown in all locations
- [ ] Test photo upload UI
- [ ] Test drag-and-drop reordering
- [ ] Test photo deletion

### 8.2 Integration Tests

- [ ] Full flow: Upload photo → Reorder → Export to CSV → Verify PhotoURLs order
- [ ] Verify latestPhotoModified updates correctly
- [ ] Test consignment form submission with Fuel Type
- [ ] Test submission approval flow with Fuel Type

### 8.3 Manual Testing Checklist

**Fuel Type:**
- [ ] Fill out consignment form with Fuel Type
- [ ] Verify Fuel Type appears in Submissions page
- [ ] Approve submission and verify Fuel Type in Inventory
- [ ] Edit inventory item and change Fuel Type
- [ ] Export to DealerCenter and verify Fuel Type in CSV

**Photo Management:**
- [ ] Upload 5 photos to inventory item
- [ ] Drag and drop to reorder
- [ ] Click Save Changes
- [ ] Verify order persists after page refresh
- [ ] Delete 2 photos
- [ ] Verify latestPhotoModified timestamp updates
- [ ] Export to DealerCenter and verify PhotoURLs order

**DealerCenter Export:**
- [ ] Verify dealer info appears correctly in CSV
- [ ] Verify all required fields are present
- [ ] Verify field order matches template
- [ ] Test FTP upload (use test/staging FTP first)
- [ ] Verify file arrives on DealerCenter FTP server

---

## Phase 9: Deployment Sequence

### 9.1 Backend Deployment (Do First)

```bash
# 1. Run database migration
cd inventory-system/server
npm run db:migrate

# 2. Commit backend changes
git add .
git commit -m "Add DealerCenter integration and photo management"

# 3. Push to trigger Railway deployment
git push origin main

# 4. Set environment variables in Railway
# (Add all DEALERCENTER_FTP_* variables)

# 5. Verify deployment succeeded
# Check Railway logs for errors
```

### 9.2 Frontend Admin Panel Deployment

```bash
# 1. Test locally first
cd admin-panel
npm run build

# 2. Commit changes
git add .
git commit -m "Add fuel type dropdowns and photo management UI"

# 3. Push to trigger Cloudflare Pages deployment
git push origin main

# 4. Verify deployment at https://admin.jpautomotivegroup.com
```

### 9.3 Consignment Form Deployment

```bash
# 1. Commit changes
git add consignment-form/
git commit -m "Add fuel type dropdown to consignment form"

# 2. Push to trigger Cloudflare Pages deployment
git push origin main

# 3. Verify deployment at https://consign.jpautomotivegroup.com
```

---

## Risk Assessment & Mitigation

### High Risk Items

**1. Photo Drag-and-Drop Implementation**
- **Risk:** Complex UI interaction, state management challenges
- **Mitigation:**
  - Use well-tested library (react-beautiful-dnd)
  - Only save on explicit "Save Changes" click
  - Add visual feedback during drag
  - Test extensively

**2. FTP Upload Reliability**
- **Risk:** Network issues, authentication failures, file corruption
- **Mitigation:**
  - Implement retry logic (3 attempts)
  - Log all FTP operations
  - Keep local copy of exported files
  - Set up monitoring/alerts
  - Test with staging FTP first

**3. Database Migration (latestPhotoModified)**
- **Risk:** Migration could fail on production
- **Mitigation:**
  - Test migration on local copy of production data
  - Backup database before migration
  - Make field nullable initially
  - Deploy during low-traffic hours

### Medium Risk Items

**1. Photo Upload File Size/Count**
- **Risk:** Large uploads could timeout or fail
- **Mitigation:**
  - Limit to 10 photos per upload
  - 10MB per file limit
  - Client-side compression before upload
  - Show progress indicator

**2. CSV Format Compatibility**
- **Risk:** DealerCenter might reject CSV if format is wrong
- **Mitigation:**
  - Match template exactly
  - Test with sample import on DealerCenter first
  - Get confirmation from DealerCenter support

### Low Risk Items

**1. Fuel Type Dropdowns**
- **Risk:** Minimal, straightforward addition
- **Mitigation:** Standard form field, already supported by backend

**2. Dealer Info Configuration**
- **Risk:** Minimal, static data
- **Mitigation:** Verify values before deployment

---

## Pre-Implementation Checklist

### Information Needed (VERIFY BEFORE STARTING)

- [ ] **Dealer Address:** Confirm actual address for JP Automotive Group LLC
- [ ] **Dealer Phone:** Confirm actual phone number
- [ ] **FTP Credentials:** Get from DealerCenter
  - FTP Host
  - FTP Port
  - FTP Username
  - FTP Password
  - Remote Path
  - Secure connection (FTPS) required?
- [ ] **DealerCenter CSV Format:** Confirm field order and date format preferences
- [ ] **Daily Export Time:** Confirm 2:00 AM is acceptable (can adjust)

### Dependencies to Install

**Backend:**
```bash
npm install basic-ftp node-cron
```

**Frontend:**
```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
```

---

## Post-Implementation Tasks

### Monitoring & Maintenance

- [ ] Set up daily export success/failure monitoring
- [ ] Create admin notification system for export failures
- [ ] Monitor R2 storage usage (photos will increase storage)
- [ ] Set up log rotation for export logs
- [ ] Document FTP troubleshooting procedures

### Future Enhancements

- [ ] Bulk photo upload (more than 10 at once)
- [ ] Image cropping/editing in admin panel
- [ ] Auto-generate vehicle descriptions from specs
- [ ] VDP (Vehicle Detail Page) URL integration after website feed is live
- [ ] WebAdDescription auto-generation
- [ ] Photo watermarking before export
- [ ] Backup DealerCenter exports to S3/R2

---

## Estimated Timeline

| Phase | Description | Time Estimate |
|-------|-------------|---------------|
| 1 | Fuel Type Integration | 2-3 hours |
| 2 | DealerCenter Export Config | 2-3 hours |
| 3 | Database Schema Updates | 1 hour |
| 4 | Photo Management API | 4-6 hours |
| 5 | Photo Management UI | 6-8 hours |
| 6 | FTP Upload System | 3-4 hours |
| 7 | Environment Configuration | 1 hour |
| 8 | Testing | 4-6 hours |
| 9 | Deployment | 2-3 hours |

**Total Estimated Time:** 25-37 hours (3-5 working days)

---

## Success Criteria

- [ ] All fuel type dropdowns functional and saving correctly
- [ ] DealerCenter CSV exports with correct format and dealer info
- [ ] Photo upload works (up to 10 photos)
- [ ] Drag-and-drop photo reordering works smoothly
- [ ] Photo order persists and reflects in exports
- [ ] latestPhotoModified tracks correctly
- [ ] Daily FTP upload runs successfully
- [ ] Manual export trigger works from admin panel
- [ ] All exports validate in DealerCenter import system
- [ ] No regressions in existing functionality

---

## Notes & Considerations

1. **Photo Storage Costs:** More photos = more R2 storage usage. Monitor costs.

2. **Export Timing:** 2:00 AM chosen to avoid business hours. DealerCenter may have preferred import times.

3. **Stock Number:** Currently leaving blank per request. If DealerCenter doesn't auto-populate, we can add logic to use last 8 of VIN.

4. **Image Compression:** Current system compresses to ~500KB. May need adjustment based on DealerCenter requirements.

5. **FTP vs SFTP:** Plan assumes standard FTP. If DealerCenter requires SFTP, need to adjust basic-ftp configuration.

6. **Error Handling:** All FTP failures should alert admin. Consider integrating with error tracking service (Sentry, etc.).

7. **VDP URLs:** Placeholder for future. Will need Jekyll feed export first.

8. **WebAdDescription:** Placeholder for future. Could auto-generate from vehicle specs.

---

## Contact Points for Questions

**Before Implementation:**
- Confirm dealer address and phone
- Get FTP credentials from DealerCenter
- Confirm CSV format requirements
- Confirm export schedule preferences

**During Implementation:**
- Test FTP connection with provided credentials
- Validate CSV format with DealerCenter support
- Get feedback on photo upload limits

---

**END OF IMPLEMENTATION PLAN**

---

*This plan is ready for execution with Opus 4.5 or similar. Each phase can be implemented sequentially with testing between phases.*
