-- ============================================================================
-- 006_audit_triggers.sql
-- Automated audit trail logging for status changes and timestamp updates
-- ============================================================================

-- 1. Generic function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_centers_updated_at ON recycling_centers;
CREATE TRIGGER trg_centers_updated_at
    BEFORE UPDATE ON recycling_centers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_records_updated_at ON recycling_records;
CREATE TRIGGER trg_records_updated_at
    BEFORE UPDATE ON recycling_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_rewards_updated_at ON rewards;
CREATE TRIGGER trg_rewards_updated_at
    BEFORE UPDATE ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 2. Audit trigger for Recycling Centers verification status transitions
CREATE OR REPLACE FUNCTION log_center_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.current_verification_status IS DISTINCT FROM NEW.current_verification_status) THEN
        INSERT INTO center_status_history (
            history_id,
            center_id,
            old_status,
            new_status,
            changed_by,
            reason,
            changed_at
        ) VALUES (
            gen_random_uuid(),
            NEW.center_id,
            OLD.current_verification_status,
            NEW.current_verification_status,
            NULL, -- Can be supplemented by session variable if set
            'Status updated via center lifecycle transition',
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_center_status_audit ON recycling_centers;
CREATE TRIGGER trg_center_status_audit
    AFTER UPDATE OF current_verification_status ON recycling_centers
    FOR EACH ROW
    EXECUTE FUNCTION log_center_status_change();


-- 3. Audit trigger for Recycling Records status transitions
CREATE OR REPLACE FUNCTION log_record_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO record_status_history (
            history_id,
            record_id,
            old_status,
            new_status,
            changed_by,
            reason,
            changed_at
        ) VALUES (
            gen_random_uuid(),
            NEW.record_id,
            OLD.status,
            NEW.status,
            NULL, -- Can be supplemented by session variable if set
            'Status updated to ' || NEW.status,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_status_audit ON recycling_records;
CREATE TRIGGER trg_record_status_audit
    AFTER UPDATE OF status ON recycling_records
    FOR EACH ROW
    EXECUTE FUNCTION log_record_status_change();
