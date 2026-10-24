# >>> DB-INTEGRATION-POINT: PostgreSQL Verification Repository
# Executes parameterized queries against 'center_verifications' and 'center_status_history'.

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID, uuid4

from app.db.postgres import get_db_connection
from app.repositories.base import CenterStatusHistory, CenterVerification, VerificationRepoBase


class PgVerificationRepo(VerificationRepoBase):
    async def create_verification(self, center_id: UUID, status: str, reviewer_id: Optional[UUID], valid_from: Optional[date], valid_until: Optional[date], rejection_reason: Optional[str]) -> CenterVerification:
        v_id = uuid4()
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO center_verifications (
                        verification_id, center_id, status, reviewer_id,
                        valid_from, valid_until, rejection_reason, reviewed_at, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING verification_id, center_id, status, reviewer_id, valid_from, valid_until, rejection_reason, reviewed_at, created_at
                    """,
                    (v_id, center_id, status, reviewer_id, valid_from, valid_until, rejection_reason)
                )
                row = cur.fetchone()

                # Update the center's current_verification_status (trigger trg_center_status_audit fires)
                cur.execute(
                    """
                    UPDATE recycling_centers
                    SET current_verification_status = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE center_id = %s
                    """,
                    (status, center_id)
                )
                return CenterVerification(**row)

    async def get_verifications_for_center(self, center_id: UUID) -> List[CenterVerification]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT verification_id, center_id, status, reviewer_id, valid_from, valid_until, rejection_reason, reviewed_at, created_at
                    FROM center_verifications
                    WHERE center_id = %s
                    ORDER BY created_at DESC
                    """,
                    (center_id,)
                )
                rows = cur.fetchall()
                return [CenterVerification(**r) for r in rows]

    async def get_status_history(self, center_id: UUID) -> List[CenterStatusHistory]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT history_id, center_id, old_status, new_status, changed_by, reason, changed_at
                    FROM center_status_history
                    WHERE center_id = %s
                    ORDER BY changed_at DESC
                    """,
                    (center_id,)
                )
                rows = cur.fetchall()
                return [CenterStatusHistory(**r) for r in rows]
