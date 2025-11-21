-- Performance Optimization Migration
-- Add indexes for commonly filtered and sorted columns
-- Run this migration to improve query performance on inventory filtering

-- Composite index for common filter queries (status + make + model + year)
-- This dramatically improves queries that filter by multiple columns
CREATE INDEX IF NOT EXISTS idx_inventory_filters
ON inventory(status, make, model, year);

-- Index for price range queries on available vehicles
-- Partial index saves space by only indexing available vehicles
CREATE INDEX IF NOT EXISTS idx_inventory_price_range
ON inventory(price)
WHERE status = 'available';

-- Index for make and model searches (case-insensitive)
-- Supports ILIKE queries for vehicle search
CREATE INDEX IF NOT EXISTS idx_inventory_make_lower
ON inventory(LOWER(make));

CREATE INDEX IF NOT EXISTS idx_inventory_model_lower
ON inventory(LOWER(model));

-- Index for year range queries
CREATE INDEX IF NOT EXISTS idx_inventory_year
ON inventory(year DESC);

-- Index for mileage filtering
CREATE INDEX IF NOT EXISTS idx_inventory_mileage
ON inventory(mileage);

-- Customer email lookups in pending submissions
-- Improves performance when checking for duplicate submissions
CREATE INDEX IF NOT EXISTS idx_pending_submissions_email
ON pending_submissions(customer_email);

-- Composite index for pending submissions lookup by status and date
CREATE INDEX IF NOT EXISTS idx_pending_submissions_status_date
ON pending_submissions(submission_status, submitted_at DESC);

-- Index for featured vehicles (partial index for available + featured)
-- This is more efficient than the existing single-column index
DROP INDEX IF EXISTS idx_inventory_featured;
CREATE INDEX IF NOT EXISTS idx_inventory_featured_available
ON inventory(featured, created_at DESC)
WHERE status = 'available';

-- Verify indexes were created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('inventory', 'pending_submissions')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
