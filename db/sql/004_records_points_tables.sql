-- ============================================================================
-- 004_records_points_tables.sql
-- Recycling records, receipts, points ledger, rewards, redemptions, badges
-- ============================================================================

-- 1. Recycling Records
CREATE TABLE IF NOT EXISTS recycling_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    center_id UUID NOT NULL REFERENCES recycling_centers(center_id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES device_categories(category_id) ON DELETE RESTRICT,
    weight_kg NUMERIC(8,2) NOT NULL,
    estimated_units INT NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    notes TEXT,
    mongo_photo_id UUID, -- Shared UUID with MongoDB device_photo_metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Record Status History (Audit trail of every record status change)
CREATE TABLE IF NOT EXISTS record_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL REFERENCES recycling_records(record_id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Receipts & Certificates
CREATE TABLE IF NOT EXISTS receipts (
    receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL UNIQUE REFERENCES recycling_records(record_id) ON DELETE RESTRICT,
    receipt_reference VARCHAR(100) NOT NULL UNIQUE,
    issued_by_center_id UUID NOT NULL REFERENCES recycling_centers(center_id) ON DELETE RESTRICT,
    issuance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    verification_code VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Points Ledger (Double-entry style financial ledger; exactly one award per record enforced by UNIQUE constraint)
CREATE TABLE IF NOT EXISTS points_ledger (
    ledger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    record_id UUID UNIQUE REFERENCES recycling_records(record_id) ON DELETE RESTRICT, -- Guarantees max 1 award per record
    transaction_type VARCHAR(50) NOT NULL,
    points INT NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Rewards Catalog
CREATE TABLE IF NOT EXISTS rewards (
    reward_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
    redemption_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reward_id UUID NOT NULL REFERENCES rewards(reward_id) ON DELETE RESTRICT,
    points_spent INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed',
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Badges
CREATE TABLE IF NOT EXISTS badges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(100) DEFAULT 'military_tech',
    required_records INT NOT NULL DEFAULT 0,
    required_points INT NOT NULL DEFAULT 0
);

-- 8. User Badges Junction
CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);
