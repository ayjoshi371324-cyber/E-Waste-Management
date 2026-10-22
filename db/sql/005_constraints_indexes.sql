-- ============================================================================
-- 005_constraints_indexes.sql
-- Integrity constraints, CHECK conditions, and spatial/performance indexes
-- ============================================================================

-- 1. Check Constraints
ALTER TABLE device_categories
    ADD CONSTRAINT chk_category_base_points CHECK (base_points >= 0),
    ADD CONSTRAINT chk_category_points_per_kg CHECK (points_per_kg >= 0);

ALTER TABLE category_materials
    ADD CONSTRAINT chk_material_percentage CHECK (estimated_percentage >= 0 AND estimated_percentage <= 100);

ALTER TABLE recycling_centers
    ADD CONSTRAINT chk_center_verification_status CHECK (
        current_verification_status IN ('pending', 'verified', 'rejected', 'expired')
    );

ALTER TABLE center_verifications
    ADD CONSTRAINT chk_verification_status CHECK (
        status IN ('pending', 'verified', 'rejected', 'expired')
    );

ALTER TABLE recycling_records
    ADD CONSTRAINT chk_record_weight_positive CHECK (weight_kg > 0),
    ADD CONSTRAINT chk_record_units_positive CHECK (estimated_units > 0),
    ADD CONSTRAINT chk_record_status CHECK (
        status IN ('pending', 'approved', 'rejected')
    );

ALTER TABLE points_ledger
    ADD CONSTRAINT chk_ledger_points_nonzero CHECK (points <> 0),
    ADD CONSTRAINT chk_ledger_tx_type CHECK (
        transaction_type IN ('recycling_award', 'reward_redemption', 'manual_adjustment')
    );

ALTER TABLE rewards
    ADD CONSTRAINT chk_reward_cost_positive CHECK (points_cost > 0),
    ADD CONSTRAINT chk_reward_stock_non_negative CHECK (stock_quantity >= 0);

ALTER TABLE redemptions
    ADD CONSTRAINT chk_redemption_points_positive CHECK (points_spent > 0),
    ADD CONSTRAINT chk_redemption_status CHECK (
        status IN ('completed', 'cancelled')
    );

-- 2. Geospatial Index (GIST) on Recycling Center Location
CREATE INDEX IF NOT EXISTS idx_centers_location_gist 
    ON recycling_centers USING GIST (location);

-- 3. High-Performance B-Tree Indexes
CREATE INDEX IF NOT EXISTS idx_centers_verification_status 
    ON recycling_centers (current_verification_status);

CREATE INDEX IF NOT EXISTS idx_center_categories_reverse 
    ON center_accepted_categories (category_id, center_id);

CREATE INDEX IF NOT EXISTS idx_records_user_created 
    ON recycling_records (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_records_center_status 
    ON recycling_records (center_id, status);

CREATE INDEX IF NOT EXISTS idx_records_status_created 
    ON recycling_records (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user 
    ON points_ledger (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at 
    ON sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_receipts_reference 
    ON receipts (receipt_reference);

CREATE INDEX IF NOT EXISTS idx_receipts_verification_code 
    ON receipts (verification_code);

CREATE INDEX IF NOT EXISTS idx_redemptions_user 
    ON redemptions (user_id, redeemed_at DESC);
