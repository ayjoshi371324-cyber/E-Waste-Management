import logging
from typing import Any, List, Optional, Union
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import get_settings
from app.deps import require_admin, require_center_rep
from app.repositories.base import CenterSearchResult, RecyclingCenter, User
from app.schemas.domain import (
    CenterCreateRequest,
    CenterResponse,
    CenterUpdateRequest,
    CenterVerificationRequest,
    GeocodeResponse,
)
from app.services.centers_service import CentersService
from app.services.geocoding import resolve_location_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/centers", tags=["Recycling Centers"])
centers_service = CentersService()


@router.get("/nearby", response_model=List[CenterSearchResult])
async def search_nearby_centers(
    lat: float = Query(..., ge=-90.0, le=90.0, description="User latitude in degrees (-90 to 90)"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="User longitude in degrees (-180 to 180)"),
    radius_km: float = Query(25.0, ge=1.0, le=500.0, description="Search radius in kilometers"),
    category_id: Optional[UUID] = Query(None, description="Filter by accepted device category ID"),
    verified_only: bool = Query(True, description="Filter for certified/verified centers only"),
):
    """
    Dedicated spatial search endpoint called by the frontend nearby-center locator.
    Calculates geodesic distance (via PostGIS in live mode or Haversine in mock mode)
    and returns matching facilities ordered by distance ascending.
    """
    settings = get_settings()
    clean_cat_id = category_id if isinstance(category_id, UUID) else None
    clean_verified = verified_only if isinstance(verified_only, bool) else True
    clean_radius = float(radius_km) if isinstance(radius_km, (int, float)) else 25.0

    logger.info(
        "Nearby centers search request: lat=%.4f, lng=%.4f, radius_km=%.1f, category_id=%s, verified_only=%s [DB_MODE=%s]",
        lat, lng, clean_radius, clean_cat_id, clean_verified, settings.DB_MODE
    )
    try:
        results = await centers_service.search_nearby(
            lat=float(lat),
            lng=float(lng),
            radius_km=clean_radius,
            category_id=clean_cat_id,
            verified_only=clean_verified,
        )
        logger.info(
            "Nearby centers search succeeded: %d facility/facilities found within %.1f km [DB_MODE=%s]",
            len(results), clean_radius, settings.DB_MODE
        )
        return results
    except Exception as e:
        logger.error("Error executing nearby centers search: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search nearby centers: {str(e)}",
        )


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode_location(
    query: str = Query(..., min_length=2, description="City name, neighborhood, or 6-digit postal PIN code")
):
    """
    Geocodes a manual user location query (City name or 6-digit postal PIN code)
    into latitude/longitude coordinates. Returns 404 if not found.
    """
    clean_query = query.strip()
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location query cannot be empty."
        )
    result = await resolve_location_query(clean_query)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Location '{clean_query}' could not be resolved. Please enter a valid city name or 6-digit PIN code."
        )
    lat, lng, display_name = result
    logger.info("Resolved manual query '%s' to (%.4f, %.4f) - %s", clean_query, lat, lng, display_name)
    return GeocodeResponse(latitude=lat, longitude=lng, display_name=display_name)


@router.get("", response_model=Union[List[CenterSearchResult], List[CenterResponse]])
async def list_or_search_centers(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="User latitude"),
    lng: Optional[float] = Query(None, ge=-180.0, le=180.0, description="User longitude"),
    radius_km: float = Query(25.0, ge=1.0, le=500.0),
    category_id: Optional[UUID] = Query(None),
    verified_only: bool = Query(True),
):
    """
    Root centers endpoint:
    - If lat and lng query parameters are both supplied, performs spatial nearby search.
    - If only one coordinate is supplied, raises HTTP 400.
    - If no coordinates are supplied, returns all registered centers with full profiles (for dropdowns/admin queue).
    """
    settings = get_settings()

    if (lat is not None and lng is None) or (lat is None and lng is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both 'lat' and 'lng' must be provided together for spatial search. Partial coordinates are not allowed."
        )

    is_lat_valid = isinstance(lat, (int, float))
    is_lng_valid = isinstance(lng, (int, float))

    if is_lat_valid and is_lng_valid:
        clean_cat_id = category_id if isinstance(category_id, UUID) else None
        clean_verified = verified_only if isinstance(verified_only, bool) else True
        clean_radius = float(radius_km) if isinstance(radius_km, (int, float)) else 25.0

        logger.info(
            "Spatial search via root centers endpoint: lat=%.4f, lng=%.4f, radius_km=%.1f [DB_MODE=%s]",
            lat, lng, clean_radius, settings.DB_MODE
        )
        try:
            return await centers_service.search_nearby(
                lat=float(lat),
                lng=float(lng),
                radius_km=clean_radius,
                category_id=clean_cat_id,
                verified_only=clean_verified,
            )
        except Exception as e:
            logger.error("Error in spatial search on root centers endpoint: %s", str(e), exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to search centers: {str(e)}",
            )

    logger.info("Listing all recycling centers [DB_MODE=%s]", settings.DB_MODE)
    try:
        centers = await centers_service.list_all_centers()
        return [
            CenterResponse(
                center_id=c.center_id,
                name=c.name,
                address=c.address,
                contact_phone=c.contact_phone,
                contact_email=c.contact_email,
                latitude=c.latitude,
                longitude=c.longitude,
                operational_hours=c.operational_hours,
                current_verification_status=c.current_verification_status,
                accepted_categories=c.accepted_categories,
            )
            for c in centers
        ]
    except Exception as e:
        logger.error("Error listing all centers: %s", str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list centers: {str(e)}",
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
    try:
        center = await centers_service.update_center(
            center_id=center_id,
            name=req.name,
            address=req.address,
            contact_phone=req.contact_phone,
            contact_email=req.contact_email,
            latitude=req.latitude,
            longitude=req.longitude,
            operational_hours=req.operational_hours,
            accepted_categories=req.accepted_categories,
        )
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{center_id}/verify", status_code=status.HTTP_200_OK)
async def verify_center(
    center_id: UUID,
    req: CenterVerificationRequest,
    admin: User = Depends(require_admin),
):
    try:
        verif = await centers_service.verify_center(
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
