# Smart E-Waste Recycling Platform — API Contract

## 1. Authentication & Session Strategy
- **Session Mechanism**: Server-side session stored in PostgreSQL `sessions` table.
- **Client Identification**: Secure HTTP-only cookie named `ewaste_session`.
- **Role Enforcement**:
  - `admin`: Platform administration, review queue, verification decisions, catalog/rewards management.
  - `center_rep`: Center management, drop-off verification, issuing receipts.
  - `user`: Citizen account for browsing, drop-off evidence submission, points tracking, and redemption.
- **Response Format**: `application/json`.
- **Standard Error Format**:
  ```json
  {
    "detail": "Error description message",
    "error_code": "RESOURCE_NOT_FOUND"
  }
  ```

---

## 2. Endpoints Overview

### Auth & User Profile (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a new citizen or center representative. |
| `POST` | `/api/v1/auth/login` | Public | Verify credentials, issue `Set-Cookie: ewaste_session=...`. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Invalidate session in DB and clear session cookie. |
| `GET` | `/api/v1/auth/me` | Authenticated | Return currently logged-in user and role information. |

#### `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "user_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "user@example.com",
    "full_name": "Jane Citizen",
    "role": "user"
  }
  ```

---

### Device Categories & Catalog (`/api/v1/categories`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/categories` | Public | List all active e-waste categories and recovery multipliers. |
| `GET` | `/api/v1/categories/{category_id}` | Public | Detailed category information, materials, and safety guidance. |
| `POST` | `/api/v1/categories` | Admin | Create a new electronic category. |

---

### Recycling Centers & Nearby Spatial Search (`/api/v1/centers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/centers` | Public | Search centers with spatial query: `lat`, `lng`, `radius_km`, `category_id`, `verified_only`. |
| `GET` | `/api/v1/centers/{center_id}` | Public | Detailed center info, accepted categories, operational hours. |
| `POST` | `/api/v1/centers` | Admin / Center Rep | Register a new recycling center. |
| `PUT` | `/api/v1/centers/{center_id}` | Admin / Center Rep | Update center profile and operational hours. |
| `POST` | `/api/v1/centers/{center_id}/verify` | Admin | Approve or reject center verification status with audit log. |

#### `GET /api/v1/centers` (Spatial Proximity Query)
- **Query Parameters**:
  - `lat` (float, required): User latitude (e.g., `12.9716`)
  - `lng` (float, required): User longitude (e.g., `77.5946`)
  - `radius_km` (float, optional, default: `25.0`)
  - `category_id` (UUID, optional): Filter by center accepting this category.
  - `verified_only` (bool, optional, default: `true`)
- **Response 200 OK**:
  ```json
  [
    {
      "center_id": "c1f7b6b1-412e-48fd-9df7-23b0a72ad41c",
      "name": "EcoGreen Electronics Recovery Center",
      "address": "45 Industrial Layout, Sector 3",
      "distance_meters": 2340.5,
      "distance_km": 2.34,
      "verification_status": "verified",
      "accepted_categories": ["SMARTPHONE", "LAPTOP", "BATTERY"]
    }
  ]
  ```

---

### Recycling Evidence & Records (`/api/v1/records`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/records` | Authenticated User | Submit recycling evidence with receipt reference or photo. |
| `GET` | `/api/v1/records/my` | Authenticated User | List current user's recycling submission history and statuses. |
| `GET` | `/api/v1/records/{record_id}` | Authenticated User/Admin | Detailed record view with receipt reference and status history. |
| `GET` | `/api/v1/admin/records/queue` | Admin | Review pending recycling records. |
| `POST` | `/api/v1/admin/records/{record_id}/review` | Admin | Approve or reject record. Approval triggers atomic points award. |

#### `POST /api/v1/records`
- **Request Body**:
  ```json
  {
    "center_id": "c1f7b6b1-412e-48fd-9df7-23b0a72ad41c",
    "category_id": "d2a6a12b-2321-4d32-9b0f-87034b7f041e",
    "weight_kg": 2.50,
    "estimated_units": 1,
    "receipt_number": "REC-2026-BLR-00492",
    "notes": "Delivered intact old Dell laptop with charger"
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "record_id": "e63a1599-528e-4a6f-9988-cb943d3a7711",
    "status": "pending",
    "created_at": "2026-10-22T16:20:00Z",
    "message": "Submission received and queued for review. Points will be awarded upon approval."
  }
  ```

---

### Photo Classification & AI Inference (`/api/v1/ai`) *(Phase 4)*

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/ai/classify-device` | Authenticated User | Upload device photo for MobileNetV3 classification. |

- **Request**: Multipart Form Data (`file: image/jpeg` or `image/png`, max 10MB).
- **Response 200 OK**:
  ```json
  {
    "photo_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "predicted_category_code": "LAPTOP",
    "confidence": 0.892,
    "is_low_confidence": false,
    "top_predictions": [
      { "category_code": "LAPTOP", "confidence": 0.892 },
      { "category_code": "TABLET", "confidence": 0.071 }
    ],
    "storage_url": "/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"
  }
  ```

---

### Points, Rewards & Gamification (`/api/v1/rewards`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/rewards` | Authenticated | View rewards catalog, stock availability, and point costs. |
| `POST` | `/api/v1/rewards/redeem` | Authenticated User | Transactionally redeem reward points with idempotency key. |
| `GET` | `/api/v1/rewards/leaderboard` | Public / Auth | Top recycling champions by points and verified kilograms. |
| `GET` | `/api/v1/rewards/my-badges` | Authenticated User | Milestones and badges achieved by user. |

#### `POST /api/v1/rewards/redeem`
- **Request Body**:
  ```json
  {
    "reward_id": "f5e4d3c2-b1a0-9876-5432-10fedcba9876",
    "idempotency_key": "user9b1_rewf5e_20261022_001"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "redemption_id": "7890abcd-ef12-3456-7890-abcdef123456",
    "reward_title": "Eco-friendly Bamboo Tech Kit",
    "points_spent": 500,
    "remaining_balance": 150,
    "status": "completed"
  }
  ```
