# Smart E-Waste Recycling Platform — Database Integration Kit

This document provides complete instructions for connecting the live PostgreSQL and MongoDB databases to the platform without any code modifications.

---

## 1. Architecture: The Database Seam

The entire application is architected around a strict repository seam.
No SQL query exists anywhere outside `backend/app/repositories/pg/`.
No PyMongo query exists anywhere outside `backend/app/repositories/mongo/`.

Every file requiring review or human attention during database hookup is tagged with:
`# >>> DB-INTEGRATION-POINT: <what to check>`

You can verify all touchpoints anytime by running:
```bash
grep -rn "DB-INTEGRATION-POINT" backend scripts
```

---

## 2. Environment Variables & Switching Modes

The application runs in mock mode by default (`DB_MODE=mock`, `MONGO_MODE=mock`).
To switch to real databases, simply edit your `.env` file:

```ini
# Database Modes
DB_MODE=postgres            # Options: mock | postgres
MONGO_MODE=mongo            # Options: mock | mongo
AI_MODE=stub                # Options: stub | model

# PostgreSQL + PostGIS Settings
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ewaste_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_MIN_CONN=2
POSTGRES_MAX_CONN=10

# MongoDB Settings
MONGO_URI=mongodb://localhost:27017
MONGO_DB=ewaste_mongo_db
```

---

## 3. Step-by-Step Hookup Procedure

### Step 3.1: Initialize PostgreSQL & PostGIS
1. Ensure PostgreSQL (version 15+) with PostGIS extension is installed and running.
2. Create the target database:
   ```bash
   createdb -U postgres ewaste_db
   ```
3. Execute all schema and seed scripts in order:
   ```bash
   psql -U postgres -d ewaste_db -f db/run_all.sql
   ```
   *(Or run files `db/sql/001_extensions.sql` through `008_seed.sql` sequentially)*.

### Step 3.2: Initialize MongoDB
1. Ensure MongoDB (version 6.0+) is running locally or in Docker:
   ```bash
   docker run -d -p 27017:27017 --name ewaste-mongo mongo:latest
   ```
2. Initialize MongoDB collections and indexes:
   ```bash
   python scripts/mongo_init.py
   ```

### Step 3.3: Run the Database Smoke Test
Execute the automated smoke verification script:
```bash
python scripts/check_db.py
```
This tests:
- PostGIS spatial function (`PostGIS_Version()`)
- Presence of all 17 tables
- Stored functions: `approve_and_award_recycling_record`, `redeem_reward_transaction`
- MongoDB ping and collection indexes

### Step 3.4: Run Live Integration Tests
Once your `.env` has `DB_MODE=postgres`, execute:
```bash
pytest backend/tests/integration/ -v -m integration
```
This runs the live PostGIS spatial query, double-approval concurrency tests, and double-redemption idempotency checks against PostgreSQL.

---

## 4. Default Seed Accounts for Testing

Once seeded with `db/sql/008_seed.sql`:
- **Admin**: `admin@ewaste.org` / `AdminPass123!`
- **Citizen**: `citizen.jane@example.com` / `AdminPass123!`
- **Center Representative**: `center.rep@ecocenter.org` / `AdminPass123!`
