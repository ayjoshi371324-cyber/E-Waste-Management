-- ============================================================================
-- 010_pg_only_tables.sql
-- PostgreSQL-only migration: replaces all MongoDB collections with PG tables.
--
-- Four new tables replace the four MongoDB collections used previously:
--   device_photo_metadata   <- was: MongoDB 'device_photo_metadata' collection
--   ai_analysis_reports     <- was: MongoDB 'ai_analysis_reports' collection
--   center_document_metadata <- was: MongoDB 'center_document_metadata' collection
--   activity_events         <- was: MongoDB 'activity_events' collection
--
-- Flexible AI result data (top_k array) and event payloads are stored as JSONB.
--
-- Also adds a new FK column 'photo_id' to recycling_records, pointing to the
-- new device_photo_metadata table. The old 'mongo_photo_id' column is kept
-- intact until Step 4 removes all MongoDB code; no data is lost or dropped.
--
-- Safe to run on an existing database: all statements use IF NOT EXISTS or
-- DO $$ guards and perform no DROP or TRUNCATE operations.
-- ============================================================================

-- ============================================================================
-- 1. device_photo_metadata
--    Stores metadata about uploaded device photos (file path stays on disk).
--    Replaces MongoDB collection 'device_photo_metadata'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_photo_metadata (
    photo_id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id         UUID        REFERENCES recycling_records(record_id) ON DELETE SET NULL,
    original_filename VARCHAR(500) NOT NULL,
    storage_path      TEXT        NOT NULL,
    mime_type         VARCHAR(100) NOT NULL,
    file_size_bytes   INT         NOT NULL CHECK (file_size_bytes > 0),
    uploaded_by       UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. ai_analysis_reports
--    Stores AI classification results for each uploaded photo.
--    'top_k' is a JSONB array of {code, label, confidence} objects, preserving
--    the flexible structure previously stored in MongoDB.
--    Replaces MongoDB collection 'ai_analysis_reports'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_analysis_reports (
    report_id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id                UUID        NOT NULL REFERENCES device_photo_metadata(photo_id) ON DELETE CASCADE,
    record_id               UUID        REFERENCES recycling_records(record_id) ON DELETE SET NULL,
    model_name              VARCHAR(100) NOT NULL DEFAULT 'MobileNetV3-Small',
    predicted_category_code VARCHAR(50)  NOT NULL,
    confidence_score        NUMERIC(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_low_confidence       BOOLEAN     NOT NULL DEFAULT FALSE,
    top_k                   JSONB       NOT NULL DEFAULT '[]'::jsonb,
    user_confirmed_code     VARCHAR(50),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. center_document_metadata
--    Stores paths to compliance/verification documents uploaded for centers.
--    Replaces MongoDB collection 'center_document_metadata'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS center_document_metadata (
    doc_id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id   UUID        NOT NULL REFERENCES recycling_centers(center_id) ON DELETE CASCADE,
    doc_type    VARCHAR(100) NOT NULL,
    file_path   TEXT        NOT NULL,
    verified    BOOLEAN     NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. activity_events
--    Append-only audit/event log. 'payload' is a JSONB dict allowing each
--    event_type to carry its own structured data without schema changes.
--    Replaces MongoDB collection 'activity_events'.
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_events (
    event_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    timestamp  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. Add photo_id FK column to recycling_records
--    Links a record to its uploaded device photo in the new PG table.
--    The legacy 'mongo_photo_id' column is left untouched until Step 4.
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recycling_records'
          AND column_name = 'photo_id'
    ) THEN
        ALTER TABLE recycling_records
            ADD COLUMN photo_id UUID REFERENCES device_photo_metadata(photo_id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 6. Indexes
-- ============================================================================

-- device_photo_metadata
CREATE INDEX IF NOT EXISTS idx_photo_meta_uploaded_by
    ON device_photo_metadata (uploaded_by, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_meta_record_id
    ON device_photo_metadata (record_id);

-- ai_analysis_reports
CREATE INDEX IF NOT EXISTS idx_ai_reports_photo_id
    ON ai_analysis_reports (photo_id);

CREATE INDEX IF NOT EXISTS idx_ai_reports_record_id
    ON ai_analysis_reports (record_id);

CREATE INDEX IF NOT EXISTS idx_ai_reports_category_code
    ON ai_analysis_reports (predicted_category_code);

-- center_document_metadata
CREATE INDEX IF NOT EXISTS idx_center_docs_center_id
    ON center_document_metadata (center_id);

-- activity_events
CREATE INDEX IF NOT EXISTS idx_activity_events_user_ts
    ON activity_events (user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_type
    ON activity_events (event_type);

CREATE INDEX IF NOT EXISTS idx_activity_events_ts
    ON activity_events (timestamp DESC);

-- recycling_records: new photo_id column index
CREATE INDEX IF NOT EXISTS idx_records_photo_id
    ON recycling_records (photo_id);

-- ============================================================================
-- 7. Verify migration
-- ============================================================================
DO $$
DECLARE
    missing TEXT := '';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_photo_metadata') THEN
        missing := missing || 'device_photo_metadata, ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_analysis_reports') THEN
        missing := missing || 'ai_analysis_reports, ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'center_document_metadata') THEN
        missing := missing || 'center_document_metadata, ';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_events') THEN
        missing := missing || 'activity_events, ';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recycling_records' AND column_name = 'photo_id'
    ) THEN
        missing := missing || 'recycling_records.photo_id column, ';
    END IF;

    IF missing <> '' THEN
        RAISE EXCEPTION '010_pg_only_tables.sql: Migration incomplete — missing: %', missing;
    END IF;

    RAISE NOTICE '010_pg_only_tables.sql: All 4 tables and recycling_records.photo_id column verified successfully.';
END $$;

