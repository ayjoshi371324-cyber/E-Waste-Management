# Smart E-Waste Recycling Platform: Phased Implementation Plan

## Where to Insert the Databases

PostgreSQL/PostGIS is built by hand in Phase 1 and connected to the backend at the start of Phase 2; MongoDB is added in Phase 4.

| Database | Build it | Connect to backend | Later use |
| --- | --- | --- | --- |
| PostgreSQL + PostGIS | Phase 1: run SQL files 001-008 manually in psql | Start of Phase 2, only after the Phase 1 gate passes | Phases 3, 5, 6, 7, 8 (centers, records, points, rewards, reports) |
| MongoDB | Phase 4: create collections and indexes | Phase 4, right before photo upload and AI | Phase 5 (evidence metadata), Phase 8 (aggregation) |

- No backend code touches a database until its manual build is verified.
- Keep all raw SQL in one `repositories/` layer, so a manual schema change only touches the SQL files and that layer.
- Write to Postgres first, then MongoDB with retry, linked by shared UUIDs.

## Phase 0: Design and Contracts (3-4 days)

- Finalize the feature list under the revised scope.
- Draw the ER diagram and normalize to 3NF.
- Define the table list, constraints, and the Postgres-to-Mongo ID strategy (UUIDs shared across both databases).
- Draft the API endpoint list and repo structure: `/backend`, `/frontend`, `/db/sql`, `/uploads`.
- Set up Git, `.env.example`, and `.gitignore` (exclude `.env`).

**Output:** ER diagram, schema design document, API contract.

## Phase 1: Relational Database Build, Manual (1 week)

Version-controlled SQL files, run in order:

1. `001_extensions.sql`: PostGIS, `pgcrypto`.
2. `002_core_tables.sql`: users, roles, device_categories, materials, centers.
3. `003_verification_tables.sql`: center_verifications, status history.
4. `004_records_points_tables.sql`: recycling_records, receipts, points_ledger, badges, rewards, redemptions.
5. `005_constraints_indexes.sql`: unique receipt identifiers, one award per record, GIST index on center location, CHECK constraints.
6. `006_audit_triggers.sql`: status-change history.
7. `007_functions.sql`: approve-and-award and redeem-reward transactions.
8. `008_seed.sql`: categories, materials, sample centers, an admin user.

**Verify in psql:**

- Nearby-center PostGIS query filtered by accepted category.
- Duplicate-receipt rejection.
- Approve-and-award function run twice yields exactly one award.
- Audit rows created for verification and record status changes.

**Gate:** do not start Phase 2 until all of these pass.

## Phase 2: Backend Foundation and PostgreSQL Integration (1 week)

**Database integration point #1.**

- FastAPI project, Psycopg 3 connection pool, env-based config.
- Repository layer with parameterized raw SQL.
- Server-side sessions with secure cookies; registration, login, logout; role guards (user, admin, center representative).
- pytest setup against a test database.
- React/Vite skeleton with Material UI, login, and a role-aware layout.

## Phase 3: Catalog, Centers, Nearby Search, Center Verification (1.5 weeks)

- Device catalog search and filter (category, brand, keyword) and recycling guide pages.
- Admin center CRUD.
- PostGIS nearby search filtered by accepted category, distance, and verification status; sorted by distance and relevance.
- Leaflet map and list UI, with navigation links.
- Center verification workflow: Pending, Verified, Rejected, Expired; reviewer, validity dates, rejection reason, expiry flagging, and status history. Ratings never grant verified status.

## Phase 4: MongoDB, Photo Upload, AI Classification (1.5 weeks)

**Database integration point #2.**

- PyMongo connection and collections: `device_photo_metadata`, `ai_analysis_reports`, `center_document_metadata`, `activity_events`.
- Secure upload: type and size validation, renamed files stored in `/uploads`, paths and metadata saved in MongoDB.
- MobileNetV3 inference service returning predicted category, confidence, and a low-confidence flag.
- User confirm/correct flow, then guidance and nearby accepting centers.
- Consistency handling: write Postgres first, then Mongo with retry, using shared UUIDs. Predictions are suggestions, not safety assessments.

## Phase 5: Guidance and Evidence Submission (1 week)

- Category-specific safety guidance, data backup and secure-erasure guidance, and recycling-handling priority.
- Submit receipt or certificate evidence, creating a `Pending` recycling record.
- Duplicate receipt detection via a unique constraint, with friendly error messages.
- No points are awarded at submission.

## Phase 6: Admin Review, Receipts, Points (1.5 weeks)

- Admin review queue: approve or reject with recorded reasons.
- Approval calls the Phase 1 transaction: status change, unique receipt reference, points awarded exactly once, audit entry.
- Digital receipt page and verified recycling history page.
- Duplicate-claim and user-report investigation tools.

## Phase 7: Rewards and Redemption (1 week)

- Rewards catalog, inventory, and admin management of rules and stock.
- Transactional redemption: check balance, deduct points, decrement stock, write ledger entry, with idempotency keys.
- Badges, levels, milestones, and leaderboard.

## Phase 8: Dashboards, Analytics, AI Summaries (1 week)

- Personal and community impact dashboards; measured values clearly labeled apart from estimates, and estimates only where documented conversion factors exist.
- SQL aggregate reports and MongoDB aggregation over AI reports and evidence metadata.
- Templated text summary of recycling performance generated from aggregate results (no LLM dependency).

## Phase 9: Testing, Hardening, Demo (1 week)

- pytest coverage for transactions, constraints, and role access; Postman collections.
- Concurrency tests for double-approval and double-redeem.
- Security pass: cookie flags, upload validation, CSRF considerations.
- DBMS demo script covering: schema and normalization, PostGIS nearby query, approve-and-award transaction, duplicate-prevention constraints, audit history, aggregate reports and indexes, MongoDB aggregation, and cross-database consistency and retries.

## Suggested Next Steps

- Draft the Phase 0 table list with columns and constraints.
- Write the Phase 1 SQL files as a starting point for the manual database build.
