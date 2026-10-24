# Smart E-Waste Recycling Platform — DBMS Demo Script & Walkthrough

This demo script demonstrates the relational modeling, spatial GIS queries, transactional stored procedures, audit logging, and cross-database architecture for academic or technical evaluations.

---

## 1. Schema Architecture & 3NF Normalization
- **PostgreSQL**: 17 normalized relations covering users, sessions, categories, materials, composition junction, recycling centers, verification audits, records, digital receipts, double-entry points ledger, rewards, redemptions, and badges.
- **Foreign Key Constraints & Cascade Safeguards**:
  - `ON DELETE RESTRICT` on `users(id)` and `recycling_centers(center_id)` prevents accidental data loss for audited records.
  - `ON DELETE CASCADE` for junction tables (`center_accepted_categories`, `category_materials`).

---

## 2. PostGIS Spatial Queries Demo
Showcase how spatial queries identify nearest certified recycling centers:
```sql
SELECT
    center_id,
    name,
    address,
    current_verification_status,
    ROUND((ST_Distance(location, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography))::numeric, 1) AS distance_meters
FROM recycling_centers
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326)::geography, 25000)
  AND current_verification_status = 'verified'
ORDER BY distance_meters ASC;
```

---

## 3. Transactional Stored Functions Demo

### 3.1 Idempotent Approval & Atomic Points Award (`007_functions.sql`)
1. Demonstrate row locking (`FOR UPDATE`) on `recycling_records`.
2. Demonstrate unique constraint safeguard in `points_ledger` (`UNIQUE(record_id)`).
3. Demonstrate executing the procedure twice:
   - Call 1: Awards points, changes status to `'approved'`, generates official digital receipt.
   - Call 2: Returns `already_awarded: true`, `points_awarded: 0`, prevents double point payout.

```sql
SELECT approve_and_award_recycling_record(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
);
```

### 3.2 Atomic Reward Redemption (`007_functions.sql`)
1. Enforces user balance check (`SUM(points) >= points_cost`).
2. Row lock on `rewards` table to prevent inventory race conditions (`FOR UPDATE`).
3. Atomic stock decrement (`stock_quantity = stock_quantity - 1`).
4. Financial ledger debit entry (`points = -points_cost`).
5. Replay with identical `idempotency_key` returns previous transaction with `idempotent_replay: true`.

---

## 4. Audit History & Triggers (`006_audit_triggers.sql`)
1. Demonstrate table `center_status_history` capturing old status, new status, reviewer UUID, and timestamp whenever a center is reviewed.
2. Demonstrate table `record_status_history` logging transitions from `'pending'` to `'approved'` or `'rejected'` with timestamps.

---

## 5. Analytics & Polyglot Consistency
- **SQL Aggregations**:
  - `SUM(r.weight_kg)` and `SUM(r.weight_kg * (cm.estimated_percentage / 100.0) * m.default_impact_factor)` computes CO2 emissions prevented based on actual material composition.
- **MongoDB Aggregation**:
  - Photo metadata and MobileNetV3 AI analysis reports aggregated by predicted category code and confidence distribution.
