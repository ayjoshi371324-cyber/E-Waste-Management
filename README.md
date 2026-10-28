# Smart E-Waste Recycling & Sustainability Platform

A modular web application designed to optimize electronic waste recycling, reward sustainable drop-offs, and facilitate proximity-based center discovery with strict data integrity guarantees.

---

## 📁 Repository Structure

```text
├── .gitignore
├── .env.example
├── README.md
├── ewaste_recycling_phased_plan.md        # Master implementation roadmap
├── e_waste_recycling_minimal_tech_stack.md # Technology stack specifications & constraints
├── docs/                                  # Phase 0 Design & Contracts
│   ├── ER_DIAGRAM.md                      # Normalized 3NF entity model & Mermaid diagram
│   ├── SCHEMA_DESIGN.md                   # PostgreSQL (PostGIS & JSONB) schema reference
│   └── API_CONTRACT.md                    # REST API endpoint specifications
├── db/                                    # Database Layer
│   ├── run_all.sql                        # Master sequential database build script
│   └── sql/
│       ├── 001_extensions.sql             # PostGIS, pgcrypto
│       ├── 002_core_tables.sql            # users, roles, categories, materials, centers
│       ├── 003_verification_tables.sql   # center verification & audit history
│       ├── 004_records_points_tables.sql  # records, receipts, ledger, rewards, badges
│       ├── 005_constraints_indexes.sql    # CHECKs, GIST spatial & B-tree indexes
│       ├── 006_audit_triggers.sql         # Automated audit trail logging
│       ├── 007_functions.sql              # Transactional stored functions
│       ├── 008_seed.sql                   # Seed data (Bengaluru centers, categories, admin)
│       ├── 009_verification_tests.sql     # Verification test suite
│       └── 010_pg_only_tables.sql         # Photo metadata, AI reports, center docs, activity events (JSONB)
├── backend/                               # FastAPI backend (Psycopg 3, raw parameterized SQL)
├── frontend/                              # React + TypeScript + Vite + MUI
└── uploads/                               # Local file uploads directory
```

---

## 🚀 Database Setup (Manual Build)

### 1. Requirements
- PostgreSQL 14+ with PostGIS extension installed.

### 2. Create the Database
```bash
createdb -U postgres ewaste_db
```

### 3. Run the SQL Migration Suite
Run all migrations in order:
```bash
psql -U postgres -d ewaste_db -f db/run_all.sql
```

Alternatively, run each file sequentially:
```bash
psql -U postgres -d ewaste_db -f db/sql/001_extensions.sql
psql -U postgres -d ewaste_db -f db/sql/002_core_tables.sql
psql -U postgres -d ewaste_db -f db/sql/003_verification_tables.sql
psql -U postgres -d ewaste_db -f db/sql/004_records_points_tables.sql
psql -U postgres -d ewaste_db -f db/sql/005_constraints_indexes.sql
psql -U postgres -d ewaste_db -f db/sql/006_audit_triggers.sql
psql -U postgres -d ewaste_db -f db/sql/007_functions.sql
psql -U postgres -d ewaste_db -f db/sql/008_seed.sql
psql -U postgres -d ewaste_db -f db/sql/009_verification_tests.sql
psql -U postgres -d ewaste_db -f db/sql/010_pg_only_tables.sql
```

---

## 🚦 Gate Checkpoints
- [x] PostGIS spatial proximity query executed and verified with category filters.
- [x] Duplicate receipt rejection verified via UNIQUE constraint.
- [x] `approve_and_award_recycling_record` function run twice verified to produce exactly one points award.
- [x] Audit rows generated for center and record status transitions.
- [x] Reward redemption transaction verified with stock decrement and balance checks.
- [x] PostgreSQL-only document and metadata tables operational with JSONB for flexible payloads.
