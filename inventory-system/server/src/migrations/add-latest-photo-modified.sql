-- Migration: Add latestPhotoModified field to inventory table
-- Date: 2025-11-25
-- Description: Adds a timestamp field to track when photos were last modified for DealerCenter exports

-- Add column to inventory table
ALTER TABLE inventory
ADD COLUMN latest_photo_modified TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_inventory_latest_photo_modified ON inventory(latest_photo_modified);

-- Set default value for existing records (use updated_at as baseline)
UPDATE inventory
SET latest_photo_modified = updated_at
WHERE latest_photo_modified IS NULL;

-- Add comment
COMMENT ON COLUMN inventory.latest_photo_modified IS 'Timestamp of when vehicle photos were last modified';
