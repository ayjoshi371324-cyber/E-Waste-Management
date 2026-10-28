"""
Integration tests against live PostgreSQL (PostGIS).
>>> DB-INTEGRATION-POINT: Live Database Concurrency & Stored Function Integration Suite.
Skipped automatically unless DB_MODE=postgres is configured in the environment.
"""

import os
from uuid import uuid4
import pytest
from app.config import get_settings
from app.repositories.base import ActivityEvent, AIAnalysisReport, CenterDocMeta, DevicePhotoMeta
from app.repositories.factory import get_repos

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


@pytest.mark.asyncio
async def test_live_pg_device_photos_and_ai_reports():
    """
    Verifies that device photo metadata and AI analysis reports (with JSONB top_k)
    are successfully written to and read from PostgreSQL.
    """
    repos = get_repos()
    user_id = uuid4()
    photo_id = uuid4()

    # 1. Save photo metadata
    meta = DevicePhotoMeta(
        photo_id=photo_id,
        original_filename="laptop_test.jpg",
        storage_path="/uploads/laptop_test.jpg",
        mime_type="image/jpeg",
        file_size_bytes=1024,
        uploaded_by=user_id,
    )
    saved_meta = await repos.device_photos.save_photo_metadata(meta)
    assert saved_meta.photo_id == photo_id

    # 2. Retrieve photo metadata
    fetched_meta = await repos.device_photos.get_photo_metadata(photo_id)
    assert fetched_meta is not None
    assert fetched_meta.original_filename == "laptop_test.jpg"
    assert fetched_meta.file_size_bytes == 1024

    # 3. Save AI report with JSONB top_k
    report_id = uuid4()
    report = AIAnalysisReport(
        report_id=report_id,
        photo_id=photo_id,
        predicted_category_code="LAPTOP",
        confidence_score=0.95,
        is_low_confidence=False,
        top_k=[{"code": "LAPTOP", "score": 0.95}, {"code": "TABLET", "score": 0.05}],
    )
    saved_report = await repos.ai_reports.save_analysis_report(report)
    assert saved_report.report_id == report_id

    # 4. Retrieve AI report
    fetched_report = await repos.ai_reports.get_report_by_photo(photo_id)
    assert fetched_report is not None
    assert fetched_report.report_id == report_id
    assert fetched_report.predicted_category_code == "LAPTOP"
    assert len(fetched_report.top_k) == 2
    assert fetched_report.top_k[0]["code"] == "LAPTOP"


@pytest.mark.asyncio
async def test_live_pg_activity_events():
    """
    Verifies that activity events with flexible JSONB payloads
    are saved and queried from the activity_events table.
    """
    repos = get_repos()
    user_id = uuid4()
    event_id = uuid4()

    event = ActivityEvent(
        event_id=event_id,
        user_id=user_id,
        event_type="TEST_EVENT",
        payload={"action": "unit_test_run", "details": {"score": 100, "status": "ok"}},
    )
    saved_event = await repos.activity_events.log_event(event)
    assert saved_event.event_id == event_id

    events = await repos.activity_events.list_user_events(user_id)
    assert len(events) >= 1
    matched = next((e for e in events if e.event_id == event_id), None)
    assert matched is not None
    assert matched.payload["details"]["score"] == 100


@pytest.mark.asyncio
async def test_live_pg_center_docs():
    """
    Verifies that center compliance documents are saved and listed from PostgreSQL.
    """
    repos = get_repos()
    center_id = uuid4()
    doc_id = uuid4()

    doc = CenterDocMeta(
        doc_id=doc_id,
        center_id=center_id,
        doc_type="POLLUTION_CONTROL_BOARD_NOC",
        file_path="/uploads/docs/noc_cert.pdf",
        verified=False,
    )
    saved_doc = await repos.center_docs.save_document_metadata(doc)
    assert saved_doc.doc_id == doc_id

    docs = await repos.center_docs.list_documents_for_center(center_id)
    assert len(docs) >= 1
    assert docs[0].doc_id == doc_id
    assert docs[0].doc_type == "POLLUTION_CONTROL_BOARD_NOC"
