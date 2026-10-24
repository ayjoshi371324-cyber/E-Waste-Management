# Antigravity Prompt: Implement Phases 2-9 With the Database Deferred

Paste everything below the line into Antigravity.

---

## ROLE AND GOAL

You are the lead engineer on the **Smart E-Waste Recycling & Sustainability Platform**. Phases 0 and 1 (design docs and the SQL files in `db/`) already exist in this repository. Implement **Phases 2 through 9** of `ewaste_recycling_phased_plan.md`.

**Critical situation:** a live PostgreSQL or MongoDB connection is NOT available while you work. The human will build and connect the databases at the very end. So you must build the whole application so that it:

1. runs, and passes its tests, with **no database installed** (mock mode), and
2. switches to the real databases by changing **environment variables only**, with no code changes (real mode).

Making the database connection point obvious is as important as the features themselves.

## STEP 0: READ BEFORE WRITING ANY CODE

1. Read `ewaste_recycling_phased_plan.md`, `e_waste_recycling_minimal_tech_stack.md`, everything in `docs/`, and **every file in `db/sql/`** plus `db/run_all.sql`.
2. **The SQL files in `db/sql/` are the single source of truth** for table names, column names, constraints, and stored function names (for example `approve_and_award_recycling_record`). Never invent or rename schema objects. Use the function names exactly as defined in `007_functions.sql`.
3. Check how the seed file hashes passwords (for example `crypt(..., gen_salt('bf'))`) and use a compatible verifier in Python (bcrypt for `$2a$`/`$2b$` hashes).
4. Check whether a `sessions` table exists. If not, create `db/sql/010_sessions.sql` (session_id TEXT PK, user_id FK, created_at, expires_at, plus indexes) and add it to `db/run_all.sql`. Do not edit the other SQL files.
5. Write `docs/DB_CONTRACT.md`: a table mapping every repository method you will create to the exact SQL table(s) or function it uses. This is your plan for the SQL layer.

## HARD CONSTRAINTS (from the specs)

- Stack: React + TypeScript + Vite + Material UI; Python + FastAPI + Pydantic; **Psycopg 3 with raw parameterized SQL (no ORM, no Alembic)**; PyMongo; PyTorch + pretrained MobileNetV3; server-side sessions with secure cookies; pytest; Leaflet for maps.
- **No JWT. No ORM. No QR codes. No microservices or extra databases.**
- **No pickup concepts at all**: no pickup requests, scheduling, assignments, vehicles, tracking, routing.
- Receipts are a unique **receipt reference number** plus a viewable/printable digital receipt page. Evidence is a receipt or certificate upload only.
- "Priority" means **recycling-handling priority** (for example battery devices get stricter safety guidance), never collection priority.
- AI predictions are suggestions, not safety assessments. Low-confidence predictions are flagged for manual category selection.
- Never award points merely for uploading a photo. Points come only from approved records, exactly once.
- A center is never verified because of user ratings.
- Secrets only in `.env` (never committed). Keep `.env.example` current.

## CORE ARCHITECTURE: THE DATABASE SEAM

All database access lives behind one seam, so the database can be plugged in last.

```text
backend/app/
  main.py                  # app + routers; opens/closes pools only in real mode
  config.py                # Settings from .env (DB_MODE, MONGO_MODE, AI_MODE, ...)
  deps.py                  # session auth + role guards (get_current_user, require_admin, ...)
  db/
    postgres.py            # >>> DB INTEGRATION POINT 1: Psycopg 3 pool (only file that creates it)
    mongo.py               # >>> DB INTEGRATION POINT 2: PyMongo client (only file that creates it)
  repositories/
    base.py                # Protocols / abstract classes: the contract services depend on
    factory.py             # >>> DB INTEGRATION POINT 3: returns mock or real repos by DB_MODE / MONGO_MODE
    pg/                    # >>> DB INTEGRATION POINT 4: the ONLY place SQL strings exist
      users_repo.py  sessions_repo.py  catalog_repo.py  centers_repo.py
      verification_repo.py  records_repo.py  points_repo.py  rewards_repo.py  analytics_repo.py
    mongo/                 # real PyMongo repos: photo metadata, AI reports, center docs, activity events
    mock/                  # in-memory implementations, seeded to mirror db/sql/008_seed.sql
  services/                # business logic; talks ONLY to repositories/base.py; no SQL, no pymongo here
  routes/                  # thin FastAPI routers calling services
  schemas/                 # Pydantic request/response models
  ai/                      # classifier (AI_MODE=stub|model) and handling-priority logic
backend/tests/             # unit tests run in mock mode with no database
scripts/check_db.py        # connectivity + schema smoke test for the human to run at hookup time
```

Rules:

1. **No SQL outside `repositories/pg/`.** No `pymongo` imports outside `db/mongo.py` and `repositories/mongo/`. Services and routes depend only on the interfaces in `repositories/base.py`.
2. `DB_MODE=mock|postgres` and `MONGO_MODE=mock|mongo` (both default to `mock`). `factory.py` is the only switch. The Postgres pool and Mongo client are created only when the real mode is selected.
3. Mock repositories are in-memory, seeded with the same categories, centers, rewards, badges, and demo users as `db/sql/008_seed.sql`, and must enforce the same business rules the database enforces, so tests are meaningful: duplicate receipt rejection, one award per record, idempotent approval, redemption balance and stock checks, idempotency keys, and verification-status rules.
4. In real mode, business-critical operations **call the stored functions from `007_functions.sql`** (approve-and-award, redeem, nearby-center search) instead of re-implementing the logic in Python. The mock version mimics their behavior.
5. Mark every place a human must touch for the hookup with the exact comment `# >>> DB-INTEGRATION-POINT: <what to check>`. Running `grep -rn "DB-INTEGRATION-POINT" backend scripts` must list them all.
6. Every SQL statement is parameterized. Never use string formatting for values. Map unique-violation and check-violation errors to friendly API errors (for example duplicate receipt returns 409).
7. Postgres-to-Mongo consistency: write Postgres first, then Mongo with retry, linked by shared UUIDs. Implement this in the service layer so it behaves the same in both modes.
8. File uploads go to the local `uploads/` directory (validated type and size, random filenames). Only paths and metadata go to the database.

## PHASES TO IMPLEMENT

Complete the phases in order. After each phase: run `pytest` in mock mode, fix failures, update `docs/PROGRESS.md` (what was built, files touched, test results, and the DB touchpoints added), and commit. Do not start the next phase while tests fail.

**Phase 2: Backend foundation and auth**
- FastAPI app, config, `db/postgres.py` pool, repository base/factory/mock/pg skeleton, health endpoint (`/api/health` reports which modes are active and, in real mode, DB connectivity).
- Server-side sessions: register, login, logout, `GET /me`; HttpOnly + SameSite=Lax cookie (Secure flag configurable), session expiry, CSRF protection for state-changing requests. Role guards for user, admin, center_rep.
- React + Vite + MUI skeleton: login/register pages, auth context, role-aware layout and route guards, API client driven by `VITE_API_BASE_URL`.
- pytest setup running entirely in mock mode.

**Phase 3: Catalog, centers, nearby search, center verification**
- Device catalog search/filter (category, brand, keyword) and recycling guide data.
- Admin center CRUD; nearby search (lat, lng, radius, accepted category, verified-only, sort by distance then relevance). Real mode uses the PostGIS function/query from `db/sql`; mock mode uses a haversine calculation.
- Center verification workflow: Pending, Verified, Rejected, Expired; reviewer, validity dates, rejection reason, expiry flagging, status history.
- UI: catalog and guide pages, Leaflet map plus list with navigation links, center detail with verification status, admin center management and verification review.

**Phase 4: Mongo, photo upload, AI classification**
- Mongo repos for `device_photo_metadata`, `ai_analysis_reports`, `center_document_metadata`, `activity_events`, with a mock version.
- Secure upload endpoint, then classification. `AI_MODE=stub` returns deterministic placeholder predictions; `AI_MODE=model` loads torchvision MobileNetV3 with an optional fine-tuned weights file at `AI_MODEL_PATH`. Return predicted category, confidence, and a low-confidence flag (threshold from `.env`). State clearly in code comments and the docs that without fine-tuned e-waste weights, predictions are not reliable.
- UI: upload, prediction with confidence, confirm or correct flow, then guidance and nearby accepting centers.

**Phase 5: Guidance and evidence submission**
- Category-specific safety, data-backup, and secure-erasure guidance with handling priority.
- Submit receipt or certificate evidence creating a `Pending` record; duplicate-receipt detection with a friendly error. No points at submission.
- UI: submit-proof page, my submissions with status.

**Phase 6: Admin review, receipts, points**
- Admin review queue: approve or reject with reasons. Approval calls the approve-and-award function once; repeating it must not award twice.
- Digital receipt page (printable) and verified history page showing the receipt reference.
- Duplicate-claim and user-report investigation tools, and an audit-log viewer.

**Phase 7: Rewards and redemption**
- Rewards catalog, admin inventory and rule management, transactional redemption with idempotency keys, badges, levels, milestones, leaderboard.
- UI: rewards page, points history, badges, leaderboard, admin rewards management.

**Phase 8: Dashboards, analytics, summaries**
- Personal and community dashboards; SQL aggregate reports (in `analytics_repo.py`) and Mongo aggregations over AI reports and evidence metadata. Estimates only where a documented conversion factor exists, and **measured values are labeled separately from estimates** in the API and UI.
- Templated text summary of recycling performance generated from aggregates (no LLM dependency).

**Phase 9: Testing, hardening, demo**
- pytest coverage for services, role access, duplicate prevention, idempotency, and error mapping (mock mode).
- **Integration tests** in `backend/tests/integration/`, marked `@pytest.mark.integration`, skipped unless `DB_MODE=postgres`. Include double-approval and double-redeem concurrency tests, the nearby query, constraint violations, and audit rows. Write them now; they run at hookup time.
- Security pass: cookie flags, upload validation, CSRF, role checks on every route, no secrets in the repo.
- Postman collection in `docs/` and a DBMS demo script following section 14 of the feature spec (without QR items).

## PHASE 10: DATABASE HOOKUP KIT (prepare it, do not execute it)

Produce `docs/DATABASE_INTEGRATION.md` so the human can connect the databases in a few minutes. It must contain:

1. A table listing every integration point: file path, what it does, and what to verify.
2. The exact runbook: create the PostgreSQL database and user, enable PostGIS and pgcrypto, run `db/run_all.sql`, run the Phase 1 verification tests, start MongoDB and create the collections and indexes (provide `scripts/mongo_init.py`), fill `.env`, set `DB_MODE=postgres` and `MONGO_MODE=mongo`, run `python scripts/check_db.py`, run `pytest -m integration`, and start the app.
3. A troubleshooting list (auth failure, missing extension, schema permission, port, wrong DB name).
4. A checklist confirming mock mode and real mode return the same API shapes.

`scripts/check_db.py` must verify the Postgres connection, PostGIS version, the presence of every table and function the code uses (compare against `docs/DB_CONTRACT.md`), the Mongo connection and collections, and print a clear pass/fail report. Update `.env.example` with every variable (DB_MODE, MONGO_MODE, AI_MODE, POSTGRES_*, MONGO_*, session and cookie settings, upload limits, AI threshold).

## WORKING RULES

- Do not modify existing `db/sql/*.sql` files. If you find a bug or a missing object, record it in `docs/DB_ISSUES.md` with the proposed fix, and add new numbered files for additions.
- If something is ambiguous, choose the option that follows the specs, document the assumption in `docs/PROGRESS.md`, and continue.
- Keep code typed and readable: Pydantic models for all payloads, TypeScript types for all API responses.

## DEFINITION OF DONE

1. `pytest` passes in mock mode with no database installed.
2. The frontend and backend run together locally in mock mode and cover every page in section 11 of the feature spec.
3. All SQL strings are in `backend/app/repositories/pg/`, all pymongo code in `db/mongo.py` and `repositories/mongo/`, and `grep -rn "DB-INTEGRATION-POINT"` lists every hookup location.
4. `docs/DB_CONTRACT.md`, `docs/DATABASE_INTEGRATION.md`, `docs/PROGRESS.md`, `scripts/check_db.py`, `scripts/mongo_init.py`, and the integration tests exist.
5. Switching `DB_MODE` and `MONGO_MODE` in `.env` is the only change needed to use the real databases.
