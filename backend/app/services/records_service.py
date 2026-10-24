from typing import Any, Dict, List, Optional
from uuid import UUID

from app.repositories.base import Receipt, RecordStatusHistory, RecyclingRecord
from app.repositories.factory import get_repos


class RecordsService:
    def __init__(self):
        self.repos = get_repos()

    async def submit_evidence(
        self,
        user_id: UUID,
        center_id: UUID,
        category_id: UUID,
        weight_kg: float,
        estimated_units: int = 1,
        receipt_number: Optional[str] = None,
        notes: Optional[str] = None,
        mongo_photo_id: Optional[UUID] = None,
    ) -> RecyclingRecord:
        # Check duplicate receipt reference if provided
        if receipt_number:
            existing_receipt = await self.repos.records.get_receipt_by_reference(receipt_number.strip())
            if existing_receipt:
                raise ValueError(f"Duplicate receipt error: Receipt '{receipt_number}' has already been registered.")

        # Note: No points are awarded at submission (Status starts as 'pending')
        record = await self.repos.records.create_record(
            user_id=user_id,
            center_id=center_id,
            category_id=category_id,
            weight_kg=weight_kg,
            estimated_units=estimated_units,
            notes=notes,
            mongo_photo_id=mongo_photo_id,
            receipt_reference=receipt_number.strip() if receipt_number else None,
        )
        return record

    async def list_user_records(self, user_id: UUID) -> List[RecyclingRecord]:
        return await self.repos.records.list_by_user(user_id)

    async def get_record(self, record_id: UUID) -> Optional[RecyclingRecord]:
        return await self.repos.records.get_by_id(record_id)

    async def list_pending_review_queue(self) -> List[RecyclingRecord]:
        return await self.repos.records.list_pending_queue()

    async def review_record(
        self,
        record_id: UUID,
        reviewer_id: UUID,
        decision: str,
        rejection_reason: Optional[str] = None,
        receipt_reference: Optional[str] = None,
        verification_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Processes admin approval or rejection.
        Approval invokes the Phase 1 stored procedure / mock version:
        - Changes status to 'approved'
        - Generates digital receipt
        - Awards points atomically (enforced exactly once)
        - Records audit log
        """
        if decision == "approved":
            res = await self.repos.records.approve_and_award(
                record_id=record_id,
                reviewer_id=reviewer_id,
                receipt_reference=receipt_reference,
                verification_code=verification_code,
            )
            # Evaluate gamification badge unlocks
            rec = await self.repos.records.get_by_id(record_id)
            if rec:
                await self.repos.points.evaluate_and_award_badges(rec.user_id)
            return res
        elif decision == "rejected":
            reason = rejection_reason or "Evidence criteria not met or unverified receipt."
            rec = await self.repos.records.reject_record(
                record_id=record_id,
                reviewer_id=reviewer_id,
                reason=reason,
            )
            return {
                "success": True,
                "status": "rejected",
                "record_id": record_id,
                "points_awarded": 0,
                "already_awarded": False,
                "message": f"Record rejected: {reason}",
            }
        else:
            raise ValueError(f"Invalid review decision: {decision}")

    async def get_digital_receipt(self, record_id: UUID) -> Optional[Receipt]:
        return await self.repos.records.get_receipt_by_record_id(record_id)

    async def get_record_history(self, record_id: UUID) -> List[RecordStatusHistory]:
        return await self.repos.records.get_record_status_history(record_id)
