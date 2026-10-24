#!/usr/bin/env python3
"""
>>> DB-INTEGRATION-POINT: Database Connectivity & Smoke Test
Run this script to verify PostgreSQL (PostGIS) and MongoDB configurations, tables,
stored functions, and indexes before switching DB_MODE=postgres and MONGO_MODE=mongo.
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.config import get_settings


def check_postgres(settings):
    print("\n[1/2] Checking PostgreSQL & PostGIS...")
    try:
        import psycopg
        print(f"Connecting to: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB} as {settings.POSTGRES_USER}...")
        try:
            conn = psycopg.connect(
                settings.DATABASE_URL,
                connect_timeout=5,
            )
        except Exception:
            conn = psycopg.connect(
                host=settings.POSTGRES_HOST,
                port=settings.POSTGRES_PORT,
                dbname=settings.POSTGRES_DB,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD,
                connect_timeout=5,
            )
        with conn.cursor() as cur:
            # 1. PostGIS check
            cur.execute("SELECT PostGIS_Version();")
            pg_ver = cur.fetchone()[0]
            print(f"  [PASS] PostGIS detected: {pg_ver}")

            # 2. Key Tables Check
            required_tables = [
                "roles", "users", "sessions", "device_categories", "materials",
                "recycling_centers", "center_accepted_categories", "center_verifications",
                "center_status_history", "recycling_records", "record_status_history",
                "receipts", "points_ledger", "rewards", "redemptions", "badges", "user_badges"
            ]
            cur.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
            """)
            found_tables = {row[0] for row in cur.fetchall()}
            missing_tables = [t for t in required_tables if t not in found_tables]
            if missing_tables:
                print(f"  [FAIL] Missing tables: {missing_tables}")
                return False
            print(f"  [PASS] All {len(required_tables)} core schema tables verified.")

            # 3. Stored Functions Check
            functions = ["approve_and_award_recycling_record", "redeem_reward_transaction"]
            for fn in functions:
                cur.execute("""
                    SELECT proname FROM pg_proc WHERE proname = %s
                """, (fn,))
                if not cur.fetchone():
                    print(f"  [FAIL] Missing stored function: {fn}")
                    return False
                print(f"  [PASS] Stored function '{fn}' verified.")

        conn.close()
        print("  PostgreSQL check succeeded!")
        return True
    except Exception as e:
        print(f"  [FAIL] PostgreSQL connection error: {e}")
        return False


def check_mongodb(settings):
    print("\n[2/2] Checking MongoDB...")
    try:
        from pymongo import MongoClient
        mongo_db_name = getattr(settings, 'MONGO_DB_NAME', getattr(settings, 'MONGO_DB', 'ewaste_meta'))
        print(f"Connecting to MongoDB at: {settings.MONGO_URI} (db: {mongo_db_name})...")
        client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        db = client[mongo_db_name]
        collections = db.list_collection_names()
        print(f"  [PASS] MongoDB connection alive. Existing collections: {collections}")
        client.close()
        return True
    except Exception as e:
        print(f"  [FAIL] MongoDB connection error: {e}")
        return False


def main():
    settings = get_settings()
    print("=" * 60)
    print("Smart E-Waste Recycling Platform — Database Smoke Test")
    print("=" * 60)
    print(f"Active DB_MODE:    {settings.DB_MODE}")
    print(f"Active MONGO_MODE: {settings.MONGO_MODE}")

    pg_ok = check_postgres(settings)
    mongo_ok = check_mongodb(settings)

    print("\n" + "=" * 60)
    if pg_ok and mongo_ok:
        print("ALL DATABASE CHECKS PASSED!")
        print("You are ready to switch .env to:")
        print("  DB_MODE=postgres")
        print("  MONGO_MODE=mongo")
    else:
        print("SOME DATABASE CHECKS FAILED.")
        print("Make sure PostgreSQL and MongoDB services are started,")
        print("and run db/run_all.sql in PostgreSQL.")
    print("=" * 60)


if __name__ == "__main__":
    main()
