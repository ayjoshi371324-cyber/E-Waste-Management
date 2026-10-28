-- ============================================================================
-- run_all.sql
-- Master execution script for manual PostgreSQL + PostGIS database build
-- Usage: psql -U postgres -d ewaste_db -f db/run_all.sql
-- ============================================================================

\set ON_ERROR_STOP on

\echo '==> [1/9] Running 001_extensions.sql...'
\i db/sql/001_extensions.sql

\echo '==> [2/9] Running 002_core_tables.sql...'
\i db/sql/002_core_tables.sql

\echo '==> [3/9] Running 003_verification_tables.sql...'
\i db/sql/003_verification_tables.sql

\echo '==> [4/9] Running 004_records_points_tables.sql...'
\i db/sql/004_records_points_tables.sql

\echo '==> [5/9] Running 005_constraints_indexes.sql...'
\i db/sql/005_constraints_indexes.sql

\echo '==> [6/9] Running 006_audit_triggers.sql...'
\i db/sql/006_audit_triggers.sql

\echo '==> [7/9] Running 007_functions.sql...'
\i db/sql/007_functions.sql

\echo '==> [8/9] Running 008_seed.sql...'
\i db/sql/008_seed.sql

\echo '==> [9/9] Running 009_verification_tests.sql (GATE VERIFICATION)...'
\i db/sql/009_verification_tests.sql

\echo '==> [10/10] Running 010_pg_only_tables.sql (PostgreSQL-only migration)...'
\i db/sql/010_pg_only_tables.sql

\echo '================================================================'
\echo 'PostgreSQL full build + PostgreSQL-only migration COMPLETE!'
\echo '================================================================'
