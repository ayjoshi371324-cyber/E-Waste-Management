from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import require_admin, require_center_rep
from app.repositories.base import CenterSearchResult, RecyclingCenter, User
from app.schemas.domain import CenterCreateRequest, CenterResponse, CenterUpdateRequest, CenterVerificationRequest
from app.services.centers_service import CentersService

router = APIRouter(prefix="/api/v1/centers", tags=["Recycling Centers"])
centers_service = CentersService()


@router.get("", response_model=List[CenterSearchResult])
async def search_centers(
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude"),
    radius_km: float = Query(25.0, ge=1.0, le=500.0),
    category_id: Optional[UUID] = Query(None),
    verified_only: bool = Query(True),
):
    # Default to Bengaluru Indiranagar center coordinates if lat/lng not provided
    user_lat = lat if lat is not None else 12.9716
    user_lng = lng if lng is not None else 77.5946

    return await centers_service.search_nearby(
        lat=user_lat,
        lng=user_lng,
        radius_km=radius_km,
        category_id=category_id,
        verified_only=verified_only,
    )


@router.get("/{center_id}", response_model=CenterResponse)
async def get_center(center_id: UUID):
    center = await centers_service.get_center(center_id)
    if not center:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Center not found.")
    return CenterResponse(
        center_id=center.center_id,
        name=center.name,
        address=center.address,
        contact_phone=center.contact_phone,
        contact_email=center.contact_email,
        latitude=center.latitude,
        longitude=center.longitude,
        operational_hours=center.operational_hours,
        current_verification_status=center.current_verification_status,
        accepted_categories=center.accepted_categories,
    )


@router.post("", response_model=CenterResponse, status_code=status.HTTP_201_CREATED)
async def create_center(
    req: CenterCreateRequest,
    user: User = Depends(require_center_rep),
):
    try:
        center = await centers_service.create_center(
            name=req.name,
            address=req.address,
            contact_phone=req.contact_phone,
            contact_email=req.contact_email,
            latitude=req.latitude,
            longitude=req.longitude,
            operational_hours=req.operational_hours,
            created_by=user.id,
            accepted_categories=req.accepted_categories,
        )
        return CenterResponse(
            center_id=center.center_id,
            name=center.name,
            address=center.address,
            contact_phone=center.contact_phone,
            contact_email=center.contact_email,
            latitude=center.latitude,
            longitude=center.longitude,
            operational_hours=center.operational_hours,
            current_verification_status=center.current_verification_status,
            accepted_categories=center.accepted_categories,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{center_id}", response_model=CenterResponse)
async def update_center(
    center_id: UUID,
    req: CenterUpdateRequest,
    user: User = Depends(require_center_rep),
):
    updated = await centers_service.update_center(
        center_id=center_id,
        name=req.name,
        address=req.address,
        contact_phone=req.contact_phone,
        contact_email=req.contact_email,
        operational_hours=req.operational_hours,
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Center not found.")
    return CenterResponse(
        center_id=updated.center_id,
        name=updated.name,
        address=updated.address,
        contact_phone=updated.contact_phone,
        contact_email=updated.contact_email,
        latitude=updated.latitude,
        longitude=updated.longitude,
        operational_hours=updated.operational_hours,
        current_verification_status=updated.current_verification_status,
        accepted_categories=updated.accepted_categories,
    )


@router.post("/{center_id}/verify", status_code=status.HTTP_200_OK)
async def verify_center(
    center_id: UUID,
    req: CenterVerificationRequest,
    admin: User = Depends(require_admin),
):
    try:
        verif = await centers_service.review_verification(
            center_id=center_id,
            status=req.status,
            reviewer_id=admin.id,
            valid_from=req.valid_from,
            valid_until=req.valid_until,
            rejection_reason=req.rejection_reason,
        )
        return {
            "center_id": center_id,
            "verification_id": verif.verification_id,
            "status": verif.status,
            "reviewed_at": verif.reviewed_at,
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{center_id}/history", status_code=status.HTTP_200_OK)
async def get_center_history(
    center_id: UUID,
    admin: User = Depends(require_admin),
):
    history = await centers_service.get_center_status_history(center_id)
    return [h.model_dump() for h in history]
