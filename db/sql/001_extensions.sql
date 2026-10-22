-- ============================================================================
-- 001_extensions.sql
-- Enables required PostgreSQL extensions:
-- 1. pgcrypto: Cryptographic hashing and UUID generation (gen_random_uuid)
-- 2. postgis: Geospatial geometry data types and spatial indexing
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Verify extensions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        RAISE EXCEPTION 'pgcrypto extension failed to install';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        RAISE EXCEPTION 'postgis extension failed to install';
    END IF;
    RAISE NOTICE 'Extensions pgcrypto and postgis successfully verified.';
END $$;
