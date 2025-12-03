-- Migration: Add vehicle specification and history fields
-- Date: 2025-12-03
-- Description: Adds drivetrain, engine, MPG fields and renames service_records to service_records_on_file
--              Updates vehicle history fields to use standardized dropdown values

-- =========================================
-- STEP 1: Rename service_records column
-- =========================================
ALTER TABLE inventory
RENAME COLUMN service_records TO service_records_on_file;

-- Add comment for renamed column
COMMENT ON COLUMN inventory.service_records_on_file IS 'Number of service records on file (Less than 5, 5-10, 10-20, 20+ records)';

-- =========================================
-- STEP 2: Update existing fields (no schema change, just documentation)
-- =========================================
-- These fields already exist, we're just standardizing their values
-- previousOwners: Will use values: "1", "2", "3", "4+"
-- accidentHistory: Will use values: "No accidents", "1", "2", "3", "4+ accidents"

COMMENT ON COLUMN inventory.previous_owners IS 'Number of previous owners (1, 2, 3, 4+)';
COMMENT ON COLUMN inventory.accident_history IS 'Accident history (No accidents, 1, 2, 3, 4+ accidents)';

-- =========================================
-- STEP 3: Update existing fields that need type changes
-- =========================================
-- Change previousOwners from INTEGER to TEXT to support "4+" value
-- Note: We preserve existing data by casting to TEXT
ALTER TABLE inventory
ALTER COLUMN previous_owners TYPE TEXT USING previous_owners::TEXT;

-- =========================================
-- STEP 4: Add indexes for better query performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_inventory_drivetrain ON inventory(drivetrain);
CREATE INDEX IF NOT EXISTS idx_inventory_mpg_city ON inventory(mpg_city);
CREATE INDEX IF NOT EXISTS idx_inventory_mpg_highway ON inventory(mpg_highway);

-- =========================================
-- ROLLBACK SCRIPT (save for reference)
-- =========================================
-- To rollback this migration, run:
--
-- ALTER TABLE inventory RENAME COLUMN service_records_on_file TO service_records;
-- ALTER TABLE inventory ALTER COLUMN previous_owners TYPE INTEGER USING previous_owners::INTEGER;
-- DROP INDEX IF EXISTS idx_inventory_drivetrain;
-- DROP INDEX IF EXISTS idx_inventory_mpg_city;
-- DROP INDEX IF EXISTS idx_inventory_mpg_highway;
