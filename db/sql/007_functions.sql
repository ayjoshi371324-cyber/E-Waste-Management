-- ============================================================================
-- 007_functions.sql
-- Transactional business logic stored procedures:
-- 1. approve_and_award_recycling_record (Idempotent approval & single points award)
-- 2. redeem_reward_transaction (Atomic balance check, stock decrement, ledger entry)
-- ============================================================================

-- 1. Approve and Award Recycling Record
-- Enforces:
-- - Atomic record status update
-- - Receipt issuance
-- - Exactly one points award in points_ledger even if invoked multiple times
CREATE OR REPLACE FUNCTION approve_and_award_recycling_record(
    p_record_id UUID,
    p_reviewer_id UUID,
    p_receipt_reference VARCHAR(100) DEFAULT NULL,
    p_verification_code VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
    v_category RECORD;
    v_points_calculated INT;
    v_existing_ledger_id UUID;
    v_receipt_ref VARCHAR(100);
    v_verif_code VARCHAR(100);
    v_ledger_id UUID;
BEGIN
    -- 1. Row-level lock on the recycling record
    SELECT * INTO v_record
    FROM recycling_records
    WHERE record_id = p_record_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RECORD_NOT_FOUND: Record % does not exist', p_record_id;
    END IF;

    -- 2. Check if points have already been awarded for this record
    SELECT ledger_id INTO v_existing_ledger_id
    FROM points_ledger
    WHERE record_id = p_record_id;

    IF v_existing_ledger_id IS NOT NULL THEN
        -- Already awarded: idempotent response, prevent duplicate point award
        RETURN jsonb_build_object(
            'success', true,
            'status', v_record.status,
            'record_id', p_record_id,
            'points_awarded', 0,
            'already_awarded', true,
            'message', 'Record was already approved and points previously awarded.'
        );
    END IF;

    IF v_record.status = 'rejected' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot approve a rejected record without prior status reset';
    END IF;

    -- 3. Fetch category calculation factors
    SELECT base_points, points_per_kg INTO v_category
    FROM device_categories
    WHERE category_id = v_record.category_id;

    IF NOT FOUND THEN
        v_points_calculated := 50; -- Default fallback
    ELSE
        v_points_calculated := ROUND(v_category.base_points + (v_record.weight_kg * v_category.points_per_kg));
    END IF;

    -- 4. Update recycling record status to approved
    UPDATE recycling_records
    SET status = 'approved',
        updated_at = CURRENT_TIMESTAMP
    WHERE record_id = p_record_id;

    -- 5. Generate receipt reference if not provided
    v_receipt_ref := COALESCE(p_receipt_reference, 'REC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || SUBSTRING(p_record_id::text, 1, 8));
    v_verif_code  := COALESCE(p_verification_code, 'VCODE-' || SUBSTRING(gen_random_uuid()::text, 1, 12));

    -- 6. Insert receipt (ignoring if receipt already exists for this record)
    INSERT INTO receipts (
        receipt_id,
        record_id,
        receipt_reference,
        issued_by_center_id,
        issuance_date,
        verification_code,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_record_id,
        v_receipt_ref,
        v_record.center_id,
        CURRENT_DATE,
        v_verif_code,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (record_id) DO NOTHING;

    -- 7. Insert points into points_ledger (Guaranteed exactly one award due to UNIQUE (record_id))
    v_ledger_id := gen_random_uuid();
    INSERT INTO points_ledger (
        ledger_id,
        user_id,
        record_id,
        transaction_type,
        points,
        idempotency_key,
        notes,
        created_at
    ) VALUES (
        v_ledger_id,
        v_record.user_id,
        p_record_id,
        'recycling_award',
        v_points_calculated,
        'award_' || p_record_id::text,
        'Points awarded for recycling record ' || p_record_id::text || ' (' || v_record.weight_kg || ' kg)',
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (record_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'approved',
        'record_id', p_record_id,
        'points_awarded', v_points_calculated,
        'already_awarded', false,
        'receipt_reference', v_receipt_ref,
        'message', 'Record approved, receipt generated, and points awarded successfully.'
    );
END;
$$ LANGUAGE plpgsql;


-- 2. Redeem Reward Transaction
-- Enforces:
-- - Idempotency via unique idempotency_key
-- - Row lock on reward row to prevent stock race conditions
-- - Verified points balance check (insufficient points rejection)
-- - Atomic stock decrement and points ledger debit
CREATE OR REPLACE FUNCTION redeem_reward_transaction(
    p_user_id UUID,
    p_reward_id UUID,
    p_idempotency_key VARCHAR(100)
)
RETURNS JSONB AS $$
DECLARE
    v_existing_redemption RECORD;
    v_reward RECORD;
    v_current_balance INT;
    v_redemption_id UUID;
BEGIN
    -- 1. Idempotency Check: if this idempotency_key was already processed, return existing redemption
    SELECT * INTO v_existing_redemption
    FROM redemptions
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
        SELECT COALESCE(SUM(points), 0) INTO v_current_balance
        FROM points_ledger
        WHERE user_id = p_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'redemption_id', v_existing_redemption.redemption_id,
            'reward_id', v_existing_redemption.reward_id,
            'points_spent', v_existing_redemption.points_spent,
            'remaining_balance', v_current_balance,
            'idempotent_replay', true,
            'message', 'Reward was previously redeemed with this idempotency key.'
        );
    END IF;

    -- 2. Lock the reward row to prevent overselling
    SELECT * INTO v_reward
    FROM rewards
    WHERE reward_id = p_reward_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'REWARD_NOT_FOUND: Reward % does not exist', p_reward_id;
    END IF;

    IF NOT v_reward.is_active THEN
        RAISE EXCEPTION 'REWARD_INACTIVE: Reward "%" is currently not active', v_reward.title;
    END IF;

    IF v_reward.stock_quantity <= 0 THEN
        RAISE EXCEPTION 'OUT_OF_STOCK: Reward "%" is out of stock', v_reward.title;
    END IF;

    -- 3. Calculate user's current points balance
    SELECT COALESCE(SUM(points), 0) INTO v_current_balance
    FROM points_ledger
    WHERE user_id = p_user_id;

    IF v_current_balance < v_reward.points_cost THEN
        RAISE EXCEPTION 'INSUFFICIENT_POINTS: Current balance % is less than required % points',
            v_current_balance, v_reward.points_cost;
    END IF;

    -- 4. Decrement inventory stock
    UPDATE rewards
    SET stock_quantity = stock_quantity - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE reward_id = p_reward_id;

    -- 5. Insert negative transaction in points_ledger
    INSERT INTO points_ledger (
        ledger_id,
        user_id,
        record_id,
        transaction_type,
        points,
        idempotency_key,
        notes,
        created_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        NULL,
        'reward_redemption',
        -v_reward.points_cost,
        'ledger_redeem_' || p_idempotency_key,
        'Redeemed reward: ' || v_reward.title,
        CURRENT_TIMESTAMP
    );

    -- 6. Record redemption
    v_redemption_id := gen_random_uuid();
    INSERT INTO redemptions (
        redemption_id,
        user_id,
        reward_id,
        points_spent,
        status,
        idempotency_key,
        redeemed_at
    ) VALUES (
        v_redemption_id,
        p_user_id,
        p_reward_id,
        v_reward.points_cost,
        'completed',
        p_idempotency_key,
        CURRENT_TIMESTAMP
    );

    RETURN jsonb_build_object(
        'success', true,
        'redemption_id', v_redemption_id,
        'reward_title', v_reward.title,
        'points_spent', v_reward.points_cost,
        'remaining_balance', v_current_balance - v_reward.points_cost,
        'idempotent_replay', false,
        'message', 'Reward successfully redeemed.'
    );
END;
$$ LANGUAGE plpgsql;
