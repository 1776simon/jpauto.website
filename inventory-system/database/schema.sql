-- JP Auto Inventory Management System
-- PostgreSQL Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (OAuth-based authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50) NOT NULL, -- 'google' or 'microsoft'
    oauth_id VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer', -- 'admin', 'manager', 'viewer'
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Pending submissions table (customer vehicle submissions)
CREATE TABLE pending_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Submission metadata
    submission_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,

    -- Customer information
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),

    -- Vehicle basic information
    year INTEGER NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100),
    vin VARCHAR(17) UNIQUE,
    mileage INTEGER,
    asking_price DECIMAL(10, 2),

    -- Vehicle details
    exterior_color VARCHAR(100),
    interior_color VARCHAR(100),
    transmission VARCHAR(50),
    engine VARCHAR(100),
    fuel_type VARCHAR(50),
    drivetrain VARCHAR(20),
    body_type VARCHAR(50),
    doors INTEGER,
    title_status VARCHAR(50),

    -- Condition
    condition_rating INTEGER, -- 1-5 scale
    condition_notes TEXT,
    accident_history TEXT,
    service_records TEXT,

    -- Images (stored as JSON array of Cloudflare R2 URLs)
    images JSONB DEFAULT '[]'::jsonb,
    primary_image_url TEXT,

    -- Additional notes
    customer_notes TEXT,
    internal_notes TEXT,

    -- Timestamps
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table (approved vehicles for sale)
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Inventory status
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'sold', 'pending', 'hold'
    featured BOOLEAN DEFAULT false,

    -- Vehicle basic information
    year INTEGER NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    trim VARCHAR(100),
    vin VARCHAR(17) UNIQUE NOT NULL,
    stock_number VARCHAR(50) UNIQUE,

    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2), -- Internal cost
    msrp DECIMAL(10, 2),

    -- Vehicle details
    mileage INTEGER NOT NULL,
    exterior_color VARCHAR(100),
    interior_color VARCHAR(100),
    transmission VARCHAR(50),
    engine VARCHAR(100),
    fuel_type VARCHAR(50),
    drivetrain VARCHAR(20),
    body_type VARCHAR(50),
    doors INTEGER,
    title_status VARCHAR(50) DEFAULT 'Clean',

    -- Performance
    mpg_city INTEGER,
    mpg_highway INTEGER,
    horsepower INTEGER,

    -- Features (stored as JSON array)
    features JSONB DEFAULT '[]'::jsonb,

    -- Images (stored as JSON array of Cloudflare R2 URLs)
    images JSONB DEFAULT '[]'::jsonb,
    primary_image_url TEXT,

    -- History
    previous_owners INTEGER,
    accident_history TEXT,
    service_records TEXT,
    carfax_available BOOLEAN DEFAULT false,
    carfax_url TEXT,

    -- Warranty
    warranty_description TEXT,

    -- Description and marketing
    description TEXT,
    marketing_title VARCHAR(255),

    -- Export tracking
    exported_to_jekyll BOOLEAN DEFAULT false,
    exported_to_jekyll_at TIMESTAMP,
    exported_to_dealer_center BOOLEAN DEFAULT false,
    exported_to_dealer_center_at TIMESTAMP,
    exported_to_autotrader BOOLEAN DEFAULT false,
    exported_to_autotrader_at TIMESTAMP,
    exported_to_cargurus BOOLEAN DEFAULT false,
    exported_to_cargurus_at TIMESTAMP,
    exported_to_facebook BOOLEAN DEFAULT false,
    exported_to_facebook_at TIMESTAMP,

    -- Metadata
    source VARCHAR(50), -- 'submission', 'manual', 'dealer_center', 'auction'
    source_submission_id UUID REFERENCES pending_submissions(id),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_added DATE DEFAULT CURRENT_DATE,
    sold_date DATE
);

-- Export logs table (track all exports)
CREATE TABLE export_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    export_type VARCHAR(50) NOT NULL, -- 'jekyll', 'dealer_center', 'autotrader', 'cargurus', 'facebook'
    export_format VARCHAR(20), -- 'xml', 'csv', 'json', 'markdown'
    vehicle_count INTEGER,
    file_path TEXT,
    file_url TEXT,
    exported_by UUID REFERENCES users(id),
    exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'partial'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Activity logs table (audit trail)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'export'
    entity_type VARCHAR(50) NOT NULL, -- 'inventory', 'submission', 'user'
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
-- Basic indexes
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_vin ON inventory(vin);
CREATE INDEX idx_inventory_created_at ON inventory(created_at);
CREATE INDEX idx_pending_submission_status ON pending_submissions(submission_status);
CREATE INDEX idx_pending_submission_vin ON pending_submissions(vin);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_export_logs_type ON export_logs(export_type);
CREATE INDEX idx_export_logs_exported_at ON export_logs(exported_at);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Performance optimization indexes (added 2025-01)
-- Composite index for common filter queries (status + make + model + year)
CREATE INDEX idx_inventory_filters ON inventory(status, make, model, year);

-- Price range queries on available vehicles (partial index)
CREATE INDEX idx_inventory_price_range ON inventory(price) WHERE status = 'available';

-- Case-insensitive search indexes for make and model
CREATE INDEX idx_inventory_make_lower ON inventory(LOWER(make));
CREATE INDEX idx_inventory_model_lower ON inventory(LOWER(model));

-- Year range queries
CREATE INDEX idx_inventory_year ON inventory(year DESC);

-- Mileage filtering
CREATE INDEX idx_inventory_mileage ON inventory(mileage);

-- Customer email lookups
CREATE INDEX idx_pending_submissions_email ON pending_submissions(customer_email);

-- Pending submissions by status and date
CREATE INDEX idx_pending_submissions_status_date ON pending_submissions(submission_status, submitted_at DESC);

-- Featured vehicles (partial index for available + featured)
CREATE INDEX idx_inventory_featured_available ON inventory(featured, created_at DESC) WHERE status = 'available';

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_submissions_updated_at BEFORE UPDATE ON pending_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW active_inventory AS
SELECT * FROM inventory
WHERE status = 'available'
ORDER BY created_at DESC;

CREATE VIEW featured_vehicles AS
SELECT * FROM inventory
WHERE status = 'available' AND featured = true
ORDER BY created_at DESC;

CREATE VIEW pending_review AS
SELECT * FROM pending_submissions
WHERE submission_status = 'pending'
ORDER BY submitted_at ASC;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO users (email, name, oauth_provider, oauth_id, role)
-- VALUES ('admin@jpautomotivegroup.com', 'Admin User', 'google', 'test123', 'admin');
