import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_categories_and_guidance(client: AsyncClient):
    resp = await client.get("/api/v1/categories")
    assert resp.status_code == 200
    cats = resp.json()
    assert len(cats) >= 6

    # Test category detail with guidance
    laptop_cat = next(c for c in cats if c["code"] == "LAPTOP")
    detail_resp = await client.get(f"/api/v1/categories/{laptop_cat['category_id']}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["handling_priority"] == "secure_data_wipe"
    assert len(detail["safety_guidance"]["data_sanitization_steps"]) > 0


@pytest.mark.asyncio
async def test_nearby_centers_spatial_search(client: AsyncClient):
    # Search around Indiranagar Bengaluru (12.9716, 77.5946) within 15 km via root endpoint
    resp = await client.get("/api/v1/centers?lat=12.9716&lng=77.5946&radius_km=15&verified_only=true")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 2
    # Verify sorted by distance
    assert results[0]["distance_meters"] <= results[1]["distance_meters"]


@pytest.mark.asyncio
async def test_nearby_centers_dedicated_nearby_endpoint(client: AsyncClient):
    # Dedicated /api/v1/centers/nearby endpoint called by frontend
    resp = await client.get("/api/v1/centers/nearby?lat=12.9716&lng=77.5946&radius_km=25&verified_only=true")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 3
    # Check distance ordering
    assert results[0]["distance_km"] <= results[1]["distance_km"] <= results[2]["distance_km"]
    assert results[0]["verification_status"] == "verified"


@pytest.mark.asyncio
async def test_nearby_centers_category_filtering(client: AsyncClient):
    # Filter by SMARTPHONE category (category_id = 11111111-1111-1111-1111-111111110001)
    cat_id = "11111111-1111-1111-1111-111111110001"
    resp = await client.get(f"/api/v1/centers/nearby?lat=12.9716&lng=77.5946&radius_km=25&category_id={cat_id}")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 2
    for c in results:
        assert "SMARTPHONE" in c["accepted_categories"]


@pytest.mark.asyncio
async def test_nearby_centers_no_match_small_radius(client: AsyncClient):
    # Tiny radius of 1 km (no centers in seed exist within 1 km of 12.9716, 77.5946)
    resp = await client.get("/api/v1/centers/nearby?lat=12.9716&lng=77.5946&radius_km=1&verified_only=true")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_nearby_centers_nonexistent_category(client: AsyncClient):
    # Non-existent category ID returns 0 results cleanly (no 500 error)
    bad_cat = "99999999-9999-9999-9999-999999999999"
    resp = await client.get(f"/api/v1/centers/nearby?lat=12.9716&lng=77.5946&radius_km=25&category_id={bad_cat}")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_nearby_centers_invalid_coordinates(client: AsyncClient):
    # Coordinates exceeding geographic range must return 422 validation error
    resp = await client.get("/api/v1/centers/nearby?lat=999.0&lng=77.5946")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_all_centers_without_coordinates(client: AsyncClient):
    # Root endpoint without lat/lng returns full list of centers (for dropdowns/admin queue)
    resp = await client.get("/api/v1/centers")
    assert resp.status_code == 200
    centers = resp.json()
    assert len(centers) >= 4
    for c in centers:
        assert "current_verification_status" in c
        assert "accepted_categories" in c


@pytest.mark.asyncio
async def test_nearby_centers_missing_coordinates(client: AsyncClient):
    # Missing coordinates on /nearby must fail with 422 - NEVER default to Bengaluru
    resp = await client.get("/api/v1/centers/nearby")
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_root_centers_partial_coordinates(client: AsyncClient):
    # Only one coordinate provided must fail with 400
    resp1 = await client.get("/api/v1/centers?lat=12.9716")
    assert resp1.status_code == 400
    resp2 = await client.get("/api/v1/centers?lng=77.5946")
    assert resp2.status_code == 400


@pytest.mark.asyncio
async def test_geocode_city_and_pincode(client: AsyncClient):
    # Geocode city
    resp_city = await client.get("/api/v1/centers/geocode?query=Mumbai")
    assert resp_city.status_code == 200
    data = resp_city.json()
    assert abs(data["latitude"] - 19.0760) < 0.01

    # Geocode PIN
    resp_pin = await client.get("/api/v1/centers/geocode?query=560038")
    assert resp_pin.status_code == 200
    data_pin = resp_pin.json()
    assert abs(data_pin["latitude"] - 12.9784) < 0.01


@pytest.mark.asyncio
async def test_geocode_unknown_location(client: AsyncClient):
    resp = await client.get("/api/v1/centers/geocode?query=unknownplace999999xyz")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_nearby_centers_nashik_search(client: AsyncClient):
    # Test searching around Nashik CBS (19.9975, 73.7898)
    # 25 km radius, verified_only=true: returns certified center (M. S. Malik in Vilholi)
    resp = await client.get("/api/v1/centers/nearby?lat=19.9975&lng=73.7898&radius_km=25&verified_only=true")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert "M. S. Malik" in results[0]["name"]
    assert results[0]["distance_km"] < 15.0

    # 25 km radius, verified_only=false: returns all facilities including expired authorizations
    resp_all = await client.get("/api/v1/centers/nearby?lat=19.9975&lng=73.7898&radius_km=25&verified_only=false")
    assert resp_all.status_code == 200
    results_all = resp_all.json()
    assert len(results_all) >= 5

    # 35 km radius, verified_only=true: includes Sinnar facilities (Mayra, Trishulin)
    resp_35 = await client.get("/api/v1/centers/nearby?lat=19.9975&lng=73.7898&radius_km=35&verified_only=true")
    assert resp_35.status_code == 200
    results_35 = resp_35.json()
    assert len(results_35) >= 3


@pytest.mark.asyncio
async def test_evidence_submission_and_double_approval(admin_client: AsyncClient, citizen_client: AsyncClient):
    # 1. Citizen submits recycling record
    submit_resp = await citizen_client.post(
        "/api/v1/records",
        json={
            "center_id": "33333333-3333-3333-3333-333333330001",
            "category_id": "11111111-1111-1111-1111-111111110002",  # Laptop
            "weight_kg": 2.50,
            "estimated_units": 1,
            "receipt_number": "REC-TEST-2026-001",
            "notes": "Intact Dell laptop",
        },
    )
    assert submit_resp.status_code == 201
    rec_data = submit_resp.json()
    record_id = rec_data["record_id"]
    assert rec_data["status"] == "pending"

    # 2. Duplicate receipt number rejection check
    dup_resp = await citizen_client.post(
        "/api/v1/records",
        json={
            "center_id": "33333333-3333-3333-3333-333333330001",
            "category_id": "11111111-1111-1111-1111-111111110002",
            "weight_kg": 1.00,
            "receipt_number": "REC-TEST-2026-001",
        },
    )
    assert dup_resp.status_code == 409

    # 3. Admin queue contains pending submission
    queue_resp = await admin_client.get("/api/v1/admin/records/queue")
    assert queue_resp.status_code == 200
    queue = queue_resp.json()
    assert any(r["record_id"] == record_id for r in queue)

    # 4. First approval: awards points atomically
    appr1_resp = await admin_client.post(
        f"/api/v1/admin/records/{record_id}/review",
        json={"decision": "approved", "receipt_reference": "REC-FINAL-001"},
    )
    assert appr1_resp.status_code == 200
    res1 = appr1_resp.json()
    assert res1["success"] is True
    assert res1["points_awarded"] > 0
    assert res1["already_awarded"] is False

    # 5. Second approval attempt: IDEMPOTENT replay, points NOT awarded twice
    appr2_resp = await admin_client.post(
        f"/api/v1/admin/records/{record_id}/review",
        json={"decision": "approved", "receipt_reference": "REC-FINAL-001"},
    )
    assert appr2_resp.status_code == 200
    res2 = appr2_resp.json()
    assert res2["success"] is True
    assert res2["already_awarded"] is True
    assert res2["points_awarded"] == 0

    # 6. Digital receipt is viewable
    receipt_resp = await citizen_client.get(f"/api/v1/records/{record_id}/receipt")
    assert receipt_resp.status_code == 200
    assert receipt_resp.json()["receipt_reference"] == "REC-FINAL-001"


@pytest.mark.asyncio
async def test_rewards_redemption_flow(admin_client: AsyncClient, citizen_client: AsyncClient):
    # Give citizen points via approved recycling
    sub_resp = await citizen_client.post(
        "/api/v1/records",
        json={
            "center_id": "33333333-3333-3333-3333-333333330001",
            "category_id": "11111111-1111-1111-1111-111111110002",
            "weight_kg": 20.0,  # ~600 points
        },
    )
    rec_id = sub_resp.json()["record_id"]
    await admin_client.post(f"/api/v1/admin/records/{rec_id}/review", json={"decision": "approved"})

    # Check citizen balance
    bal_resp = await citizen_client.get("/api/v1/rewards/my-balance")
    assert bal_resp.status_code == 200
    initial_balance = bal_resp.json()["current_balance"]
    assert initial_balance >= 600

    # Redeem Tree Plantation Certificate (150 pts)
    tree_reward_id = "44444444-4444-4444-4444-444444440004"
    idem_key = "test_idem_redeem_12345"

    redeem_resp = await citizen_client.post(
        "/api/v1/rewards/redeem",
        json={"reward_id": tree_reward_id, "idempotency_key": idem_key},
    )
    assert redeem_resp.status_code == 200
    r_data = redeem_resp.json()
    assert r_data["points_spent"] == 150
    assert r_data["remaining_balance"] == initial_balance - 150
    assert r_data["idempotent_replay"] is False

    # Replay redemption with identical idempotency key
    replay_resp = await citizen_client.post(
        "/api/v1/rewards/redeem",
        json={"reward_id": tree_reward_id, "idempotency_key": idem_key},
    )
    assert replay_resp.status_code == 200
    replay_data = replay_resp.json()
    assert replay_data["idempotent_replay"] is True


@pytest.mark.asyncio
async def test_analytics_and_impact_summaries(citizen_client: AsyncClient):
    # Personal impact
    impact_resp = await citizen_client.get("/api/v1/analytics/my-impact")
    assert impact_resp.status_code == 200
    impact = impact_resp.json()
    assert "measured" in impact
    assert "estimates" in impact
    assert "text_summary" in impact
    assert len(impact["text_summary"]) > 20

    # Community impact
    comm_resp = await citizen_client.get("/api/v1/analytics/community")
    assert comm_resp.status_code == 200
    comm = comm_resp.json()
    assert "measured" in comm
    assert "estimates" in comm


@pytest.mark.asyncio
async def test_ai_photo_classification(citizen_client: AsyncClient):
    import io
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (150, 150), color=(30, 30, 30)).save(buf, format="JPEG")
    files = {"file": ("my_old_phone.jpg", buf.getvalue(), "image/jpeg")}
    ai_resp = await citizen_client.post("/api/v1/ai/classify-device", files=files)
    assert ai_resp.status_code == 200
    data = ai_resp.json()
    assert "predicted_category_code" in data
    assert data["confidence"] > 0.0
    assert len(data["top_predictions"]) > 0


@pytest.mark.asyncio
async def test_admin_rewards_management_and_rules(admin_client: AsyncClient, citizen_client: AsyncClient):
    # 1. Non-admin forbidden from admin rewards overview
    denied_resp = await citizen_client.get("/api/v1/rewards/admin/overview")
    assert denied_resp.status_code == 403

    # 2. Admin can view rewards overview metrics
    overview_resp = await admin_client.get("/api/v1/rewards/admin/overview")
    assert overview_resp.status_code == 200
    ov = overview_resp.json()
    assert "total_points_awarded" in ov
    assert "total_points_redeemed" in ov
    assert "active_rewards_count" in ov

    # 3. Admin can list all rewards (including inactive ones)
    all_rew_resp = await admin_client.get("/api/v1/rewards/admin/all")
    assert all_rew_resp.status_code == 200
    assert len(all_rew_resp.json()) >= 4

    # 4. Admin creates a new reward
    new_reward_resp = await admin_client.post(
        "/api/v1/rewards",
        json={
            "title": "Recycled Plastic Bottle",
            "description": "BPA-free reusable bottle",
            "points_cost": 200,
            "stock_quantity": 25,
            "is_active": True,
        },
    )
    assert new_reward_resp.status_code == 201
    created_rew = new_reward_resp.json()
    rew_id = created_rew["reward_id"]

    # 5. Admin updates the reward
    update_resp = await admin_client.put(
        f"/api/v1/rewards/{rew_id}",
        json={"points_cost": 180, "stock_quantity": 30},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["points_cost"] == 180

    # 6. Admin views and updates reward rules
    rules_resp = await admin_client.get("/api/v1/rewards/rules")
    assert rules_resp.status_code == 200
    rules = rules_resp.json()
    assert len(rules) >= 6
    target_cat = rules[0]

    update_rule_resp = await admin_client.put(
        f"/api/v1/rewards/rules/{target_cat['category_id']}",
        json={"base_points": 75, "points_per_kg": 30.0},
    )
    assert update_rule_resp.status_code == 200
    assert update_rule_resp.json()["base_points"] == 75

    # 7. Admin deletes the created reward
    del_resp = await admin_client.delete(f"/api/v1/rewards/{rew_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True
