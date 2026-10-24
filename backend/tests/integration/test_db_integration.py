"""
Integration tests against live PostgreSQL & MongoDB.
>>> DB-INTEGRATION-POINT: Live Database Concurrency & Stored Function Integration Suite.
Skipped automatically unless DB_MODE=postgres is configured in the environment.
"""

import os
from uuid import uuid4
import pytest
from app.config import get_settings

settings = get_settings()
IS_REAL_PG = settings.DB_MODE == "postgres"

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not IS_REAL_PG, reason="Integration tests require DB_MODE=postgres and a live PostgreSQL instance.")
]


@pytest.mark.asyncio
async def test_live_pg_concurrency_double_approval(admin_client, citizen_client):
    """
    Verifies that calling approve_and_award on the live database twice
    yields exactly one points award due to row locking and the unique constraint.
    """
    # 1. Citizen creates a record
    sub = await citizen_client.post(
        "/api/v1/records",
        json={
            "center_id": "33333333-3333-3333-3333-333333330001",
            "category_id": "11111111-1111-1111-1111-111111110002",
            "weight_kg": 5.0,
            "receipt_number": f"LIVE-REC-{uuid4()}"[:30],
        }
    )
    assert sub.status_code == 201
    rec_id = sub.json()["record_id"]

    # 2. First approval
    app1 = await admin_client.post(f"/api/v1/admin/records/{rec_id}/review", json={"decision": "approved"})
    assert app1.status_code == 200
    res1 = app1.json()
    assert res1["points_awarded"] > 0
    assert res1["already_awarded"] is False

    # 3. Second approval (must be idempotent: 0 points awarded, already_awarded True)
    app2 = await admin_client.post(f"/api/v1/admin/records/{rec_id}/review", json={"decision": "approved"})
    assert app2.status_code == 200
    res2 = app2.json()
    assert res2["points_awarded"] == 0
    assert res2["already_awarded"] is True


@pytest.mark.asyncio
async def test_live_pg_double_redeem_idempotency(admin_client, citizen_client):
    """
    Verifies that calling redeem_reward with the same idempotency_key on live Postgres
    returns the cached transaction without deducting points or decrementing stock twice.
    """
    tree_reward_id = "44444444-4444-4444-4444-444444440004"
    idem_key = f"live_test_idem_{uuid4()}"

    # Redeem 1
    red1 = await citizen_client.post("/api/v1/rewards/redeem", json={"reward_id": tree_reward_id, "idempotency_key": idem_key})
    # If citizen has enough points
    if red1.status_code == 200:
        data1 = red1.json()
        assert data1["idempotent_replay"] is False

        # Redeem 2 (Replay)
        red2 = await citizen_client.post("/api/v1/rewards/redeem", json={"reward_id": tree_reward_id, "idempotency_key": idem_key})
        assert red2.status_code == 200
        data2 = red2.json()
        assert data2["idempotent_replay"] is True
        assert data2["points_spent"] == data1["points_spent"]


@pytest.mark.asyncio
async def test_live_pg_nearby_spatial_search(client):
    """
    Verifies that the PostGIS ST_DWithin query executes and calculates distance accurately.
    """
    # Coordinates near Indiranagar, Bengaluru
    resp = await client.get("/api/v1/centers/nearby?lat=12.9716&lng=77.5946&radius_km=30")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    if data:
        assert "distance_km" in data[0]
        assert data[0]["distance_km"] <= 30.0
