-- ============================================================================
-- 002_core_tables.sql
-- Core domain entities: roles, users, sessions, categories, materials, centers
-- ============================================================================

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sessions (Server-side session management for secure cookies, No JWT)
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(64) PRIMARY KEY, -- SHA-256 hash
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Device Categories
CREATE TABLE IF NOT EXISTS device_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    handling_priority VARCHAR(50) NOT NULL DEFAULT 'standard',
    base_points INT NOT NULL DEFAULT 50,
    points_per_kg NUMERIC(8,2) NOT NULL DEFAULT 10.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Materials
CREATE TABLE IF NOT EXISTS materials (
    material_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    default_impact_factor NUMERIC(8,4) NOT NULL DEFAULT 1.0000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Category Materials Junction (3NF composition mapping)
CREATE TABLE IF NOT EXISTS category_materials (
    category_id UUID NOT NULL REFERENCES device_categories(category_id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    estimated_percentage NUMERIC(5,2) NOT NULL,
    PRIMARY KEY (category_id, material_id)
);

-- 7. Recycling Centers (With PostGIS Point geometry)
CREATE TABLE IF NOT EXISTS recycling_centers (
    center_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    location GEOMETRY(Point, 4326) NOT NULL,
    operational_hours JSONB DEFAULT '{"monday_to_saturday": "09:00 - 18:00"}'::jsonb,
    current_verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Center Accepted Categories Junction
CREATE TABLE IF NOT EXISTS center_accepted_categories (
    center_id UUID NOT NULL REFERENCES recycling_centers(center_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES device_categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (center_id, category_id)
);
