# >>> DB-INTEGRATION-POINT: PostgreSQL Records Repository calling approve_and_award_recycling_record
# Executes parameterized queries and calls the Phase 1 stored function for atomic points awards.

import json
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
import psycopg

from app.db.postgres import get_db_connection
from app.repositories.base import Receipt, RecordStatusHistory, RecordsRepoBase, RecyclingRecord


class PgRecordsRepo(RecordsRepoBase):
    async def create_record(self, user_id: UUID, center_id: UUID, category_id: UUID, weight_kg: float, estimated_units: int, notes: Optional[str], mongo_photo_id: Optional[UUID] = None, receipt_reference: Optional[str] = None) -> RecyclingRecord:
        record_id = uuid4()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO recycling_records (
                        record_id, user_id, center_id, category_id, weight_kg, estimated_units,
                        status, notes, mongo_photo_id, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING record_id, user_id, center_id, category_id, weight_kg, estimated_units,
                              status, notes, mongo_photo_id, created_at, updated_at
                    """,
                    (record_id, user_id, center_id, category_id, weight_kg, estimated_units, notes, mongo_photo_id)
                )
                row = cur.fetchone()

                if receipt_reference:
                    cur.execute(
                        """
                        INSERT INTO receipts (
                            receipt_id, record_id, receipt_reference, issued_by_center_id,
                            issuance_date, verification_code, created_at
                        ) VALUES (
                            gen_random_uuid(), %s, %s, %s, CURRENT_DATE, %s, CURRENT_TIMESTAMP
                        )
                        """,
                        (record_id, receipt_reference.strip(), center_id, f"VCODE-{str(uuid4())[:12]}")
                    )

                # Enrich with names
                cur.execute("SELECT name, code FROM device_categories WHERE category_id = %s", (category_id,))
                cat_row = cur.fetchone()
                cur.execute("SELECT name FROM recycling_centers WHERE center_id = %s", (center_id,))
                ctr_row = cur.fetchone()

                return RecyclingRecord(
                    **row,
                    category_name=cat_row["name"] if cat_row else None,
                    category_code=cat_row["code"] if cat_row else None,
                    center_name=ctr_row["name"] if ctr_row else None,
                    receipt_reference=receipt_reference.strip() if receipt_reference else None,
                )

    async def get_by_id(self, record_id: UUID) -> Optional[RecyclingRecord]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.record_id, r.user_id, r.center_id, r.category_id, r.weight_kg,
                           r.estimated_units, r.status, r.notes, r.mongo_photo_id, r.created_at, r.updated_at,
                           dc.name AS category_name, dc.code AS category_code, rc.name AS center_name,
                           rec.receipt_reference
                    FROM recycling_records r
                    JOIN device_categories dc ON r.category_id = dc.category_id
                    JOIN recycling_centers rc ON r.center_id = rc.center_id
                    LEFT JOIN receipts rec ON r.record_id = rec.record_id
                    WHERE r.record_id = %s
                    """,
                    (record_id,)
                )
                row = cur.fetchone()
                if row:
                    return RecyclingRecord(**row)
                return None

    async def list_by_user(self, user_id: UUID) -> List[RecyclingRecord]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.record_id, r.user_id, r.center_id, r.category_id, r.weight_kg,
                           r.estimated_units, r.status, r.notes, r.mongo_photo_id, r.created_at, r.updated_at,
                           dc.name AS category_name, dc.code AS category_code, rc.name AS center_name,
                           rec.receipt_reference
                    FROM recycling_records r
                    JOIN device_categories dc ON r.category_id = dc.category_id
                    JOIN recycling_centers rc ON r.center_id = rc.center_id
                    LEFT JOIN receipts rec ON r.record_id = rec.record_id
                    WHERE r.user_id = %s
                    ORDER BY r.created_at DESC
                    """,
                    (user_id,)
                )
                rows = cur.fetchall()
                return [RecyclingRecord(**r) for r in rows]

    async def list_pending_queue(self) -> List[RecyclingRecord]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.record_id, r.user_id, r.center_id, r.category_id, r.weight_kg,
                           r.estimated_units, r.status, r.notes, r.mongo_photo_id, r.created_at, r.updated_at,
                           dc.name AS category_name, dc.code AS category_code, rc.name AS center_name,
                           rec.receipt_reference
                    FROM recycling_records r
                    JOIN device_categories dc ON r.category_id = dc.category_id
                    JOIN recycling_centers rc ON r.center_id = rc.center_id
                    LEFT JOIN receipts rec ON r.record_id = rec.record_id
                    WHERE r.status = 'pending'
                    ORDER BY r.created_at ASC
                    """
                )
                rows = cur.fetchall()
                return [RecyclingRecord(**r) for r in rows]

    async def approve_and_award(self, record_id: UUID, reviewer_id: UUID, receipt_reference: Optional[str] = None, verification_code: Optional[str] = None) -> Dict[str, Any]:
        """
        >>> DB-INTEGRATION-POINT: Invokes approve_and_award_recycling_record stored function in 007_functions.sql
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                try:
                    cur.execute(
                        "SELECT approve_and_award_recycling_record(%s, %s, %s, %s) AS result",
                        (record_id, reviewer_id, receipt_reference, verification_code)
                    )
                    row = cur.fetchone()
                    res = row["result"] if row else {}
                    if isinstance(res, str):
                        res = json.loads(res)
                    return res
                except psycopg.errors.RaiseException as e:
                    raise ValueError(str(e))
                except psycopg.errors.UniqueViolation:
                    raise ValueError(f"Receipt reference '{receipt_reference}' is already in use.")

    async def reject_record(self, record_id: UUID, reviewer_id: UUID, reason: str) -> RecyclingRecord:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE recycling_records
                    SET status = 'rejected',
                        notes = COALESCE(notes || ' | Rejection reason: ' || %s, %s),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE record_id = %s
                    RETURNING record_id, user_id, center_id, category_id, weight_kg, estimated_units,
                              status, notes, mongo_photo_id, created_at, updated_at
                    """,
                    (reason, f"Rejection reason: {reason}", record_id)
                )
                row = cur.fetchone()
                if not row:
                    raise ValueError(f"Record {record_id} not found.")

                cur.execute("SELECT name, code FROM device_categories WHERE category_id = %s", (row["category_id"],))
                cat_row = cur.fetchone()
                cur.execute("SELECT name FROM recycling_centers WHERE center_id = %s", (row["center_id"],))
                ctr_row = cur.fetchone()

                return RecyclingRecord(
                    **row,
                    category_name=cat_row["name"] if cat_row else None,
                    category_code=cat_row["code"] if cat_row else None,
                    center_name=ctr_row["name"] if ctr_row else None,
                )

    async def get_receipt_by_record_id(self, record_id: UUID) -> Optional[Receipt]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.receipt_id, r.record_id, r.receipt_reference, r.issued_by_center_id,
                           r.issuance_date, r.verification_code, r.created_at,
                           c.name AS center_name, c.address AS center_address,
                           rec.weight_kg, rec.user_id
                    FROM receipts r
                    JOIN recycling_records rec ON r.record_id = rec.record_id
                    JOIN recycling_centers c ON r.issued_by_center_id = c.center_id
                    WHERE r.record_id = %s
                    """,
                    (record_id,)
                )
                row = cur.fetchone()
                if row:
                    return Receipt(**row)
                return None

    async def get_receipt_by_reference(self, reference: str) -> Optional[Receipt]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT r.receipt_id, r.record_id, r.receipt_reference, r.issued_by_center_id,
                           r.issuance_date, r.verification_code, r.created_at,
                           c.name AS center_name, c.address AS center_address,
                           rec.weight_kg, rec.user_id
                    FROM receipts r
                    JOIN recycling_records rec ON r.record_id = rec.record_id
                    JOIN recycling_centers c ON r.issued_by_center_id = c.center_id
                    WHERE r.receipt_reference = %s
                    """,
                    (reference.strip(),)
                )
                row = cur.fetchone()
                if row:
                    return Receipt(**row)
                return None

    async def get_record_status_history(self, record_id: UUID) -> List[RecordStatusHistory]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT history_id, record_id, old_status, new_status, changed_by, reason, changed_at
                    FROM record_status_history
                    WHERE record_id = %s
                    ORDER BY changed_at DESC
                    """,
                    (record_id,)
                )
                rows = cur.fetchall()
                return [RecordStatusHistory(**r) for r in rows]
