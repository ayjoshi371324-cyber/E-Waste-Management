# Smart E-Waste Recycling Platform — DB Contract

This document provides the definitive contract mapping between every repository method across the application and the underlying PostgreSQL database objects (tables, columns, stored functions) or MongoDB collections.

---

## 1. PostgreSQL Repositories

### 1.1 `UsersRepo` (`backend/app/repositories/pg/users_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `get_by_id(user_id: UUID)` | `users`, `roles` | `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE u.id = %s` | Parameterized lookup |
| `get_by_email(email: str)` | `users`, `roles` | `SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE lower(u.email) = lower(%s)` | Case-insensitive email match |
| `create_user(...)` | `users` | `INSERT INTO users (id, email, password_hash, full_name, role_id, phone, is_active) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *` | Handles unique violation error |
| `update_user(...)` | `users` | `UPDATE users SET full_name = COALESCE(%s, full_name), phone = COALESCE(%s, phone), updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *` | Trigger `trg_users_updated_at` also updates `updated_at` |

---

### 1.2 `SessionsRepo` (`backend/app/repositories/pg/sessions_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `create_session(session_id, user_id, session_data, expires_at)` | `sessions` | `INSERT INTO sessions (session_id, user_id, session_data, expires_at) VALUES (%s, %s, %s, %s) RETURNING *` | `session_id` is SHA-256 token |
| `get_session(session_id)` | `sessions`, `users`, `roles` | `SELECT s.*, u.email, u.full_name, r.role_name FROM sessions s JOIN users u ON s.user_id = u.id JOIN roles r ON u.role_id = r.role_id WHERE s.session_id = %s AND s.expires_at > CURRENT_TIMESTAMP` | Validates session has not expired |
| `delete_session(session_id)` | `sessions` | `DELETE FROM sessions WHERE session_id = %s` | Used during logout |
| `delete_user_sessions(user_id)` | `sessions` | `DELETE FROM sessions WHERE user_id = %s` | Invalidate all user sessions |
| `cleanup_expired_sessions()` | `sessions` | `DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP` | Uses index `idx_sessions_expires_at` |

---

### 1.3 `CatalogRepo` (`backend/app/repositories/pg/catalog_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `list_categories(active_only)` | `device_categories` | `SELECT * FROM device_categories WHERE (%s = false OR is_active = true) ORDER BY name ASC` | Catalog listing |
| `get_category_by_id(category_id)` | `device_categories` | `SELECT * FROM device_categories WHERE category_id = %s` | Details & points factors |
| `get_category_by_code(code)` | `device_categories` | `SELECT * FROM device_categories WHERE code = %s` | Used by AI classifier |
| `create_category(...)` | `device_categories` | `INSERT INTO device_categories (category_id, code, name, description, handling_priority, base_points, points_per_kg) VALUES (...) RETURNING *` | Admin catalog management |
| `get_category_materials(category_id)` | `category_materials`, `materials` | `SELECT cm.*, m.name, m.code, m.unit, m.default_impact_factor FROM category_materials cm JOIN materials m ON cm.material_id = m.material_id WHERE cm.category_id = %s` | 3NF composition mapping |

---

### 1.4 `CentersRepo` (`backend/app/repositories/pg/centers_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `search_nearby(lat, lng, radius_km, category_id, verified_only)` | `recycling_centers`, `center_accepted_categories`, `device_categories` | Spatial query using `ST_DWithin` & `ST_Distance` on `location::geography`, filtered by category & `current_verification_status = 'verified'` | Uses GIST index `idx_centers_location_gist` |
| `get_by_id(center_id)` | `recycling_centers` | `SELECT c.*, ST_X(c.location) as lng, ST_Y(c.location) as lat FROM recycling_centers c WHERE c.center_id = %s` | Extracts lat/lng from geometry |
| `create_center(...)` | `recycling_centers` | `INSERT INTO recycling_centers (center_id, name, address, contact_phone, contact_email, location, operational_hours, current_verification_status, created_by) VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s, %s, %s) RETURNING *` | Accepts lng, lat |
| `update_center(...)` | `recycling_centers` | `UPDATE recycling_centers SET ... WHERE center_id = %s RETURNING *` | Triggers audit log |
| `list_accepted_categories(center_id)` | `center_accepted_categories`, `device_categories` | `SELECT dc.* FROM device_categories dc JOIN center_accepted_categories cac ON dc.category_id = cac.category_id WHERE cac.center_id = %s` | Accepted items |
| `set_accepted_categories(center_id, category_ids)` | `center_accepted_categories` | Batch delete and insert into `center_accepted_categories` | Junction table sync |

---

### 1.5 `VerificationRepo` (`backend/app/repositories/pg/verification_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `create_verification(center_id, status, reviewer_id, valid_from, valid_until, rejection_reason)` | `center_verifications`, `recycling_centers` | `INSERT INTO center_verifications (...) VALUES (...) RETURNING *` and `UPDATE recycling_centers SET current_verification_status = %s WHERE center_id = %s` | Updates center status, firing `trg_center_status_audit` |
| `get_verifications_for_center(center_id)` | `center_verifications` | `SELECT * FROM center_verifications WHERE center_id = %s ORDER BY created_at DESC` | Official review history |
| `get_status_history(center_id)` | `center_status_history` | `SELECT * FROM center_status_history WHERE center_id = %s ORDER BY changed_at DESC` | Trigger-populated audit log |

---

### 1.6 `RecordsRepo` (`backend/app/repositories/pg/records_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `create_record(user_id, center_id, category_id, weight_kg, estimated_units, notes, mongo_photo_id)` | `recycling_records` | `INSERT INTO recycling_records (...) VALUES (...) RETURNING *` | Status defaults to `'pending'` |
| `get_by_id(record_id)` | `recycling_records`, `device_categories`, `recycling_centers` | `SELECT r.*, dc.name as category_name, dc.code as category_code, rc.name as center_name FROM recycling_records r JOIN device_categories dc ON r.category_id = dc.category_id JOIN recycling_centers rc ON r.center_id = rc.center_id WHERE r.record_id = %s` | Enriched record |
| `list_by_user(user_id)` | `recycling_records`, `device_categories`, `recycling_centers` | `SELECT r.*, dc.name as category_name, rc.name as center_name, rec.receipt_reference FROM recycling_records r JOIN device_categories dc ON r.category_id = dc.category_id JOIN recycling_centers rc ON r.center_id = rc.center_id LEFT JOIN receipts rec ON r.record_id = rec.record_id WHERE r.user_id = %s ORDER BY r.created_at DESC` | User history |
| `list_pending_queue()` | `recycling_records`, `users`, `device_categories`, `recycling_centers` | `SELECT r.*, u.email as user_email, u.full_name as user_name, dc.name as category_name, rc.name as center_name FROM recycling_records r JOIN users u ON r.user_id = u.id JOIN device_categories dc ON r.category_id = dc.category_id JOIN recycling_centers rc ON r.center_id = rc.center_id WHERE r.status = 'pending' ORDER BY r.created_at ASC` | Admin review queue |
| `approve_and_award(record_id, reviewer_id, receipt_reference, verification_code)` | **`approve_and_award_recycling_record(...)`** | `SELECT approve_and_award_recycling_record(%s, %s, %s, %s) AS result` | **Calls stored function in `007_functions.sql`** |
| `reject_record(record_id, reviewer_id, reason)` | `recycling_records` | `UPDATE recycling_records SET status = 'rejected', notes = COALESCE(notes || ' | Rejection reason: ' || %s, %s), updated_at = CURRENT_TIMESTAMP WHERE record_id = %s RETURNING *` | Firing trigger `trg_record_status_audit` |
| `get_receipt_by_record_id(record_id)` | `receipts`, `recycling_records`, `recycling_centers` | `SELECT r.*, rec.weight_kg, rec.user_id, c.name as center_name, c.address as center_address FROM receipts r JOIN recycling_records rec ON r.record_id = rec.record_id JOIN recycling_centers c ON r.issued_by_center_id = c.center_id WHERE r.record_id = %s` | Printable digital receipt |
| `get_receipt_by_reference(receipt_ref)` | `receipts`, `recycling_records` | `SELECT * FROM receipts WHERE receipt_reference = %s` | Duplicate check & lookup |
| `get_record_status_history(record_id)` | `record_status_history` | `SELECT * FROM record_status_history WHERE record_id = %s ORDER BY changed_at DESC` | Audit history |

---

### 1.7 `PointsRepo` (`backend/app/repositories/pg/points_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `get_user_balance(user_id)` | `points_ledger` | `SELECT COALESCE(SUM(points), 0) AS balance FROM points_ledger WHERE user_id = %s` | Financial ledger calculation |
| `get_user_ledger(user_id)` | `points_ledger` | `SELECT * FROM points_ledger WHERE user_id = %s ORDER BY created_at DESC` | Points transaction ledger |
| `get_leaderboard(limit)` | `points_ledger`, `users`, `recycling_records` | Aggregate query grouping by user, summing positive points and verified kg, joining `users` | Citizen leaderboard |
| `get_user_badges(user_id)` | `user_badges`, `badges` | `SELECT b.*, ub.awarded_at FROM badges b JOIN user_badges ub ON b.badge_id = ub.badge_id WHERE ub.user_id = %s ORDER BY ub.awarded_at DESC` | User unlocked badges |
| `list_all_badges()` | `badges` | `SELECT * FROM badges ORDER BY required_points ASC` | Full badge catalog |
| `award_badge_if_eligible(user_id, badge_id)` | `user_badges` | `INSERT INTO user_badges (user_id, badge_id) VALUES (%s, %s) ON CONFLICT (user_id, badge_id) DO NOTHING` | Gamification milestone check |

---

### 1.8 `RewardsRepo` (`backend/app/repositories/pg/rewards_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `list_active_rewards()` | `rewards` | `SELECT * FROM rewards WHERE is_active = TRUE ORDER BY points_cost ASC` | Rewards catalog |
| `get_by_id(reward_id)` | `rewards` | `SELECT * FROM rewards WHERE reward_id = %s` | Reward details |
| `create_reward(...)` | `rewards` | `INSERT INTO rewards (...) VALUES (...) RETURNING *` | Admin reward management |
| `update_reward(...)` | `rewards` | `UPDATE rewards SET ... WHERE reward_id = %s RETURNING *` | Update stock/points |
| `redeem_reward(user_id, reward_id, idempotency_key)` | **`redeem_reward_transaction(...)`** | `SELECT redeem_reward_transaction(%s, %s, %s) AS result` | **Calls stored function in `007_functions.sql`** |
| `list_user_redemptions(user_id)` | `redemptions`, `rewards` | `SELECT r.*, rew.title as reward_title, rew.description as reward_description FROM redemptions r JOIN rewards rew ON r.reward_id = rew.reward_id WHERE r.user_id = %s ORDER BY r.redeemed_at DESC` | User redemption history |

---

### 1.9 `AnalyticsRepo` (`backend/app/repositories/pg/analytics_repo.py`)

| Method | Target SQL Object(s) | SQL Operation / Stored Function | Notes |
|---|---|---|---|
| `get_user_metrics(user_id)` | `recycling_records`, `points_ledger`, `category_materials`, `materials` | Aggregates count of approved records, total kg recycled, recovered materials estimates, total points earned | Distinguishes measured (kg, units) vs estimated (materials) |
| `get_community_metrics()` | `recycling_records`, `points_ledger`, `category_materials`, `materials` | Global aggregates across all users | Community impact dashboard |
| `get_category_metrics()` | `recycling_records`, `device_categories` | Aggregates volume and counts per device category | Breakdown metrics |

---

## 2. MongoDB Collections & Repositories

| Repository | Mongo Collection | Primary Schema Fields | Purpose |
|---|---|---|---|
| `DevicePhotoRepo` | `device_photo_metadata` | `_id`, `record_id`, `original_filename`, `storage_path`, `mime_type`, `file_size_bytes`, `uploaded_by`, `uploaded_at` | Metadata for uploaded device photos stored on disk in `/uploads` |
| `AIAnalysisRepo` | `ai_analysis_reports` | `_id`, `photo_id`, `record_id`, `model_name`, `predicted_category_code`, `confidence_score`, `is_low_confidence`, `top_k`, `user_confirmed_code`, `created_at` | Predictions and suggestions from MobileNetV3 |
| `CenterDocsRepo` | `center_document_metadata` | `_id`, `center_id`, `doc_type`, `file_path`, `verified`, `uploaded_at` | Official licensing/compliance document metadata |
| `ActivityEventsRepo` | `activity_events` | `_id`, `user_id`, `event_type`, `payload`, `timestamp` | Platform activity and audit event telemetry |

---

## 3. Database Seam Architecture

All access to PostgreSQL and MongoDB is gated behind Python Abstract Base Classes (`Protocol` / `ABC`) in `backend/app/repositories/base.py`.
- In `DB_MODE=mock`, `factory.py` returns in-memory implementations (`backend/app/repositories/mock/`) seeded with the exact data from `008_seed.sql`.
- In `DB_MODE=postgres`, `factory.py` returns the raw parameterized SQL implementations (`backend/app/repositories/pg/`).
- In `MONGO_MODE=mock`, `factory.py` returns in-memory collections.
- In `MONGO_MODE=mongo`, `factory.py` returns PyMongo collections (`backend/app/repositories/mongo/`).
- Every switch point is flagged with `# >>> DB-INTEGRATION-POINT: <what to check>`.
