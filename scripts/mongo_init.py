#!/usr/bin/env python3
"""
>>> DB-INTEGRATION-POINT: MongoDB Collection & Index Initialization
Creates collections and necessary unique/spatial/compound indexes for:
- device_photo_metadata
- ai_analysis_reports
- center_document_metadata
- activity_events
"""

import sys
from pathlib import Path

backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from pymongo import ASCENDING, DESCENDING, MongoClient
from app.config import get_settings


def init_mongo():
    settings = get_settings()
    print("=" * 60)
    print("MongoDB Initialization Script — Smart E-Waste Recycling")
    print(f"Target DB: {settings.MONGO_URI} / {settings.MONGO_DB}")
    print("=" * 60)

    client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.MONGO_DB]

    # 1. device_photo_metadata
    photos = db["device_photo_metadata"]
    photos.create_index([("photo_id", ASCENDING)], unique=True)
    photos.create_index([("uploaded_by", ASCENDING), ("created_at", DESCENDING)])
    print("  [PASS] Index created on device_photo_metadata: photo_id (unique), uploaded_by+created_at")

    # 2. ai_analysis_reports
    ai_reports = db["ai_analysis_reports"]
    ai_reports.create_index([("report_id", ASCENDING)], unique=True)
    ai_reports.create_index([("photo_id", ASCENDING)])
    ai_reports.create_index([("predicted_category_code", ASCENDING)])
    print("  [PASS] Index created on ai_analysis_reports: report_id (unique), photo_id, category_code")

    # 3. center_document_metadata
    center_docs = db["center_document_metadata"]
    center_docs.create_index([("doc_id", ASCENDING)], unique=True)
    center_docs.create_index([("center_id", ASCENDING)])
    print("  [PASS] Index created on center_document_metadata: doc_id (unique), center_id")

    # 4. activity_events
    events = db["activity_events"]
    events.create_index([("event_id", ASCENDING)], unique=True)
    events.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    events.create_index([("event_type", ASCENDING)])
    print("  [PASS] Index created on activity_events: event_id (unique), user_id+timestamp, event_type")

    print("\nMongoDB initialization completed successfully!")
    client.close()


if __name__ == "__main__":
    init_mongo()
