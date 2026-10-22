-- ============================================================================
-- 003_verification_tables.sql
-- Verification lifecycles and audit tables for recycling centers
-- ============================================================================

-- 1. Center Verifications
CREATE TABLE IF NOT EXISTS center_verifications (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES recycling_centers(center_id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    valid_from DATE,
    valid_until DATE,
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Center Status History (Audit trail of every center status change)
CREATE TABLE IF NOT EXISTS center_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL REFERENCES recycling_centers(center_id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
