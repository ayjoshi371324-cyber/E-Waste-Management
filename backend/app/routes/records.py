from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user, require_admin
from app.repositories.base import User
from app.schemas.domain import ReceiptResponse, RecordCreateRequest, RecordResponse, RecordReviewRequest
from app.services.records_service import RecordsService

router = APIRouter(tags=["Recycling Records & Evidence"])
records_service = RecordsService()


@router.post("/api/v1/records", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def submit_record(
    req: RecordCreateRequest,
    user: User = Depends(get_current_user),
):
    try:
        rec = await records_service.submit_evidence(
            user_id=user.id,
            center_id=req.center_id,
            category_id=req.category_id,
            weight_kg=req.weight_kg,
            estimated_units=req.estimated_units,
            receipt_number=req.receipt_number,
            notes=req.notes,
            photo_id=req.photo_id,
        )
        return RecordResponse(
            record_id=rec.record_id,
            user_id=rec.user_id,
            center_id=rec.center_id,
            category_id=rec.category_id,
            weight_kg=rec.weight_kg,
            estimated_units=rec.estimated_units,
            status=rec.status,
            notes=rec.notes,
            receipt_reference=rec.receipt_reference,
            created_at=rec.created_at,
            category_name=rec.category_name,
            category_code=rec.category_code,
            center_name=rec.center_name,
        )
    except ValueError as e:
        # Friendly 409 conflict error for duplicate receipts
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/api/v1/records/my", response_model=List[RecordResponse])
async def list_my_records(user: User = Depends(get_current_user)):
    records = await records_service.list_user_records(user.id)
    return [
        RecordResponse(
            record_id=r.record_id,
            user_id=r.user_id,
            center_id=r.center_id,
            category_id=r.category_id,
            weight_kg=r.weight_kg,
            estimated_units=r.estimated_units,
            status=r.status,
            notes=r.notes,
            receipt_reference=r.receipt_reference,
            created_at=r.created_at,
            category_name=r.category_name,
            category_code=r.category_code,
            center_name=r.center_name,
        )
        for r in records
    ]


@router.get("/api/v1/records/{record_id}", response_model=RecordResponse)
async def get_record(
    record_id: UUID,
    user: User = Depends(get_current_user),
):
    rec = await records_service.get_record(record_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found.")
    if user.role_name != "admin" and rec.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return RecordResponse(
        record_id=rec.record_id,
        user_id=rec.user_id,
        center_id=rec.center_id,
        category_id=rec.category_id,
        weight_kg=rec.weight_kg,
        estimated_units=rec.estimated_units,
        status=rec.status,
        notes=rec.notes,
        receipt_reference=rec.receipt_reference,
        created_at=rec.created_at,
        category_name=rec.category_name,
        category_code=rec.category_code,
        center_name=rec.center_name,
    )


@router.get("/api/v1/records/{record_id}/receipt", response_model=ReceiptResponse)
async def get_record_receipt(
    record_id: UUID,
    user: User = Depends(get_current_user),
):
    receipt = await records_service.get_digital_receipt(record_id)
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No official receipt issued for this record yet.")
    if user.role_name != "admin" and receipt.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return ReceiptResponse(
        receipt_id=receipt.receipt_id,
        record_id=receipt.record_id,
        receipt_reference=receipt.receipt_reference,
        center_name=receipt.center_name,
        center_address=receipt.center_address,
        weight_kg=receipt.weight_kg,
        issuance_date=receipt.issuance_date,
        verification_code=receipt.verification_code,
        created_at=receipt.created_at,
    )


@router.get("/api/v1/records/{record_id}/history")
async def get_record_history(
    record_id: UUID,
    admin: User = Depends(require_admin),
):
    history = await records_service.get_record_history(record_id)
    return [h.model_dump() for h in history]


# Admin Queue & Review Endpoints
@router.get("/api/v1/admin/records/queue", response_model=List[RecordResponse])
async def list_admin_queue(admin: User = Depends(require_admin)):
    pending = await records_service.list_pending_review_queue()
    return [
        RecordResponse(
            record_id=r.record_id,
            user_id=r.user_id,
            center_id=r.center_id,
            category_id=r.category_id,
            weight_kg=r.weight_kg,
            estimated_units=r.estimated_units,
            status=r.status,
            notes=r.notes,
            receipt_reference=r.receipt_reference,
            created_at=r.created_at,
            category_name=r.category_name,
            category_code=r.category_code,
            center_name=r.center_name,
        )
        for r in pending
    ]


@router.post("/api/v1/admin/records/{record_id}/review")
async def review_record_endpoint(
    record_id: UUID,
    req: RecordReviewRequest,
    admin: User = Depends(require_admin),
):
    try:
        result = await records_service.review_record(
            record_id=record_id,
            reviewer_id=admin.id,
            decision=req.decision,
            rejection_reason=req.rejection_reason,
            receipt_reference=req.receipt_reference,
            verification_code=req.verification_code,
        )
        return result
    except ValueError as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
