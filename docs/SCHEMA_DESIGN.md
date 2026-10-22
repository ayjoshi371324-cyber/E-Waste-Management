# Database Schema Design Document (PostgreSQL + PostGIS & MongoDB)

## 1. Relational Schema (PostgreSQL 14+)

### Extensions
- `uuid-ossp` or `pgcrypto`: Generates cryptographically secure v4 UUIDs via `gen_random_uuid()`.
- `postgis`: Enables geospatial data types (`geometry(Point, 4326)`) and spatial indexing (`GIST`) for proximity search.

---

### Tables and Constraints

#### 1. `roles`
Lookup table defining application authority levels.
- `role_id` (INT, PRIMARY KEY)
- `role_name` (VARCHAR(50), UNIQUE, NOT NULL): Allowed values: `'admin'`, `'user'`, `'center_representative'`.

#### 2. `users`
System accounts for citizens, administrators, and recycling center operators.
- `id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `full_name` (VARCHAR(200), NOT NULL)
- `role_id` (INT, NOT NULL, REFERENCES `roles(role_id)`)
- `phone` (VARCHAR(30), NULL)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 3. `sessions`
Server-side persistent sessions for secure HTTP-only cookie authentication.
- `session_id` (VARCHAR(64), PRIMARY KEY): SHA-256 hash of random session token.
- `user_id` (UUID, NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE)
- `session_data` (JSONB, NOT NULL DEFAULT '{}'::jsonb)
- `expires_at` (TIMESTAMPTZ, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 4. `device_categories`
Catalog of electronic waste categories (e.g., Laptops, Mobile Devices, Small Appliances, Batteries).
- `category_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `code` (VARCHAR(50), UNIQUE, NOT NULL): Upper-case identifier (e.g., `'SMARTPHONE'`, `'LAPTOP'`, `'PCB'`).
- `name` (VARCHAR(100), NOT NULL)
- `description` (TEXT)
- `handling_priority` (VARCHAR(50), DEFAULT 'standard'): e.g. `'hazardous'`, `'secure_data_wipe'`, `'standard'`.
- `base_points` (INT, NOT NULL DEFAULT 50, CHECK `base_points >= 0`)
- `points_per_kg` (NUMERIC(8,2), NOT NULL DEFAULT 10.00, CHECK `points_per_kg >= 0`)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 5. `materials`
Recoverable elements and materials contained in e-waste items.
- `material_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `code` (VARCHAR(50), UNIQUE, NOT NULL): e.g. `'COPPER'`, `'GOLD'`, `'LITHIUM'`.
- `name` (VARCHAR(100), NOT NULL)
- `unit` (VARCHAR(20), NOT NULL DEFAULT 'kg')
- `default_impact_factor` (NUMERIC(8,4), NOT NULL DEFAULT 1.0000)

#### 6. `category_materials` (Junction Table)
Normalized link specifying typical composition of each device category.
- `category_id` (UUID, REFERENCES `device_categories(category_id)` ON DELETE CASCADE)
- `material_id` (UUID, REFERENCES `materials(material_id)` ON DELETE CASCADE)
- `estimated_percentage` (NUMERIC(5,2), NOT NULL CHECK `estimated_percentage >= 0 AND estimated_percentage <= 100`)
- PRIMARY KEY (`category_id`, `material_id`)

#### 7. `recycling_centers`
Authorized drop-off and recycling facilities with PostGIS spatial coordinates.
- `center_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `name` (VARCHAR(200), NOT NULL)
- `address` (TEXT, NOT NULL)
- `contact_phone` (VARCHAR(50))
- `contact_email` (VARCHAR(255))
- `location` (`GEOMETRY(Point, 4326)`, NOT NULL)
- `current_verification_status` (VARCHAR(30), NOT NULL DEFAULT 'pending', CHECK `current_verification_status IN ('pending', 'verified', 'rejected', 'expired')`)
- `created_by` (UUID, REFERENCES `users(id)`)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 8. `center_accepted_categories` (Junction Table)
Defines which electronic device categories each center can safely process.
- `center_id` (UUID, REFERENCES `recycling_centers(center_id)` ON DELETE CASCADE)
- `category_id` (UUID, REFERENCES `device_categories(category_id)` ON DELETE CASCADE)
- PRIMARY KEY (`center_id`, `category_id`)

#### 9. `center_verifications`
Official compliance verification lifecycle for recycling facilities.
- `verification_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `center_id` (UUID, NOT NULL, REFERENCES `recycling_centers(center_id)` ON DELETE CASCADE)
- `status` (VARCHAR(30), NOT NULL CHECK `status IN ('pending', 'verified', 'rejected', 'expired')`)
- `reviewer_id` (UUID, REFERENCES `users(id)`)
- `valid_from` (DATE)
- `valid_until` (DATE)
- `rejection_reason` (TEXT)
- `reviewed_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 10. `center_status_history` (Audit Log)
Immutable audit record triggered upon any status transition of a center.
- `history_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `center_id` (UUID, NOT NULL, REFERENCES `recycling_centers(center_id)` ON DELETE CASCADE)
- `old_status` (VARCHAR(30))
- `new_status` (VARCHAR(30), NOT NULL)
- `changed_by` (UUID, REFERENCES `users(id)`)
- `reason` (TEXT)
- `changed_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 11. `recycling_records`
Core citizen drop-off transaction records.
- `record_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id` (UUID, NOT NULL, REFERENCES `users(id)`)
- `center_id` (UUID, NOT NULL, REFERENCES `recycling_centers(center_id)`)
- `category_id` (UUID, NOT NULL, REFERENCES `device_categories(category_id)`)
- `weight_kg` (NUMERIC(8,2), NOT NULL CHECK `weight_kg > 0`)
- `estimated_units` (INT NOT NULL DEFAULT 1 CHECK `estimated_units > 0`)
- `status` (VARCHAR(30), NOT NULL DEFAULT 'pending', CHECK `status IN ('pending', 'approved', 'rejected')`)
- `notes` (TEXT)
- `mongo_photo_id` (UUID NULL): Shared UUID key linking to MongoDB `device_photo_metadata`.
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 12. `record_status_history` (Audit Log)
Immutable audit record triggered upon any status transition of a recycling record.
- `history_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `record_id` (UUID, NOT NULL, REFERENCES `recycling_records(record_id)` ON DELETE CASCADE)
- `old_status` (VARCHAR(30))
- `new_status` (VARCHAR(30), NOT NULL)
- `changed_by` (UUID, REFERENCES `users(id)`)
- `reason` (TEXT)
- `changed_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 13. `receipts`
Official verified receipt or certificate reference issued by center upon item receipt.
- `receipt_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `record_id` (UUID, UNIQUE, NOT NULL, REFERENCES `recycling_records(record_id)` ON DELETE RESTRICT)
- `receipt_reference` (VARCHAR(100), UNIQUE, NOT NULL)
- `issued_by_center_id` (UUID, NOT NULL, REFERENCES `recycling_centers(center_id)`)
- `issuance_date` (DATE NOT NULL DEFAULT CURRENT_DATE)
- `verification_code` (VARCHAR(100), UNIQUE, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 14. `points_ledger`
Double-entry style financial-grade points ledger. Points are awarded or spent here.
- `ledger_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id` (UUID, NOT NULL, REFERENCES `users(id)`)
- `record_id` (UUID, UNIQUE NULL, REFERENCES `recycling_records(record_id)`): Ensures exactly one award per recycling record.
- `transaction_type` (VARCHAR(50), NOT NULL CHECK `transaction_type IN ('recycling_award', 'reward_redemption', 'manual_adjustment')`)
- `points` (INT, NOT NULL CHECK `points != 0`)
- `idempotency_key` (VARCHAR(100), UNIQUE, NOT NULL)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 15. `rewards`
Catalog of eco-friendly merchandise, vouchers, and discounts.
- `reward_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `title` (VARCHAR(200), NOT NULL)
- `description` (TEXT)
- `points_cost` (INT, NOT NULL CHECK `points_cost > 0`)
- `stock_quantity` (INT, NOT NULL DEFAULT 0 CHECK `stock_quantity >= 0`)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 16. `redemptions`
Redemption history of user-exchanged rewards.
- `redemption_id` (UUID, PRIMARY KEY, DEFAULT `gen_random_uuid()`)
- `user_id` (UUID, NOT NULL, REFERENCES `users(id)`)
- `reward_id` (UUID, NOT NULL, REFERENCES `rewards(reward_id)`)
- `points_spent` (INT, NOT NULL CHECK `points_spent > 0`)
- `status` (VARCHAR(30), NOT NULL DEFAULT 'completed', CHECK `status IN ('completed', 'cancelled')`)
- `idempotency_key` (VARCHAR(100), UNIQUE, NOT NULL)
- `redeemed_at` (TIMESTAMPTZ, DEFAULT CURRENT_TIMESTAMP)

#### 17. `badges` & `user_badges`
Gamification milestones based on verified recycling records and points earned.
- `badges`: `badge_id` (UUID PK), `code` (VARCHAR UNIQUE), `name`, `description`, `required_records`, `required_points`.
- `user_badges`: `user_id` (UUID FK), `badge_id` (UUID FK), `awarded_at` (TIMESTAMPTZ). Composite PK (`user_id`, `badge_id`).

---

## 2. Spatial & Performance Indexes
1. `idx_centers_location`: Spatial GIST index on `recycling_centers(location)` for fast KNN (`<->`) and `ST_DWithin` queries.
2. `idx_centers_status`: B-tree index on `recycling_centers(current_verification_status)`.
3. `idx_center_categories_lookup`: B-tree on `center_accepted_categories(category_id, center_id)`.
4. `idx_records_user_status`: B-tree on `recycling_records(user_id, status)`.
5. `idx_records_center_status`: B-tree on `recycling_records(center_id, status)`.
6. `idx_points_user`: B-tree on `points_ledger(user_id)`.
7. `idx_sessions_expiry`: B-tree on `sessions(expires_at)` for background session cleanup.

---

## 3. MongoDB Collections (Phase 4 Specification)

1. `device_photo_metadata`:
   - `_id`: UUID
   - `record_id`: UUID (relates to `recycling_records.record_id`)
   - `original_filename`: String
   - `storage_path`: String (`uploads/<uuid>.<ext>`)
   - `mime_type`: String
   - `file_size_bytes`: Integer
   - `uploaded_by`: UUID
   - `uploaded_at`: ISO Date

2. `ai_analysis_reports`:
   - `_id`: UUID
   - `photo_id`: UUID (relates to `device_photo_metadata._id`)
   - `record_id`: UUID
   - `model_name`: "MobileNetV3-Small"
   - `predicted_category_code`: String
   - `confidence_score`: Float (0.0 to 1.0)
   - `is_low_confidence`: Boolean (score < 0.60)
   - `top_k`: Array of `{ category_code: string, confidence: float }`
   - `user_confirmed_code`: String
   - `created_at`: ISO Date

3. `center_document_metadata`:
   - `_id`: UUID
   - `center_id`: UUID
   - `doc_type`: String ("license", "epa_cert", "compliance_statement")
   - `file_path`: String
   - `verified`: Boolean
   - `uploaded_at`: ISO Date

4. `activity_events`:
   - `_id`: UUID
   - `user_id`: UUID
   - `event_type`: String
   - `payload`: Object
   - `timestamp`: ISO Date
