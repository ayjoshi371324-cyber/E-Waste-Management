from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.repositories.base import CenterSearchResult, CenterStatusHistory, CenterVerification, RecyclingCenter
from app.repositories.factory import get_repos


class CentersService:
    def __init__(self):
        self.repos = get_repos()

    async def search_nearby(
        self,
        lat: float,
        lng: float,
        radius_km: float = 25.0,
        category_id: Optional[UUID] = None,
        verified_only: bool = True,
    ) -> List[CenterSearchResult]:
        return await self.repos.centers.search_nearby(
            lat=lat,
            lng=lng,
            radius_km=radius_km,
            category_id=category_id,
            verified_only=verified_only,
        )

    async def get_center(self, center_id: UUID) -> Optional[RecyclingCenter]:
        return await self.repos.centers.get_by_id(center_id)

    async def list_all_centers(self) -> List[RecyclingCenter]:
        return await self.repos.centers.list_all_centers()

    async def create_center(
        self,
        name: str,
        address: str,
        contact_phone: Optional[str],
        contact_email: Optional[str],
        latitude: float,
        longitude: float,
        operational_hours: Dict[str, Any],
        created_by: Optional[UUID],
        accepted_categories: List[UUID],
    ) -> RecyclingCenter:
        return await self.repos.centers.create_center(
            name=name,
            address=address,
            contact_phone=contact_phone,
            contact_email=contact_email,
            latitude=latitude,
            longitude=longitude,
            operational_hours=operational_hours,
            current_verification_status="pending",
            created_by=created_by,
            accepted_categories=accepted_categories,
        )

    async def update_center(
        self,
        center_id: UUID,
        name: Optional[str] = None,
        address: Optional[str] = None,
        contact_phone: Optional[str] = None,
        contact_email: Optional[str] = None,
        operational_hours: Optional[Dict[str, Any]] = None,
    ) -> Optional[RecyclingCenter]:
        return await self.repos.centers.update_center(
            center_id=center_id,
            name=name,
            address=address,
            contact_phone=contact_phone,
            contact_email=contact_email,
            operational_hours=operational_hours,
        )

    async def review_verification(
        self,
        center_id: UUID,
        status: str,
        reviewer_id: UUID,
        valid_from: Optional[date] = None,
        valid_until: Optional[date] = None,
        rejection_reason: Optional[str] = None,
    ) -> CenterVerification:
        if status not in ("verified", "rejected", "expired"):
            raise ValueError(f"Invalid verification decision: {status}")
        return await self.repos.verification.create_verification(
            center_id=center_id,
            status=status,
            reviewer_id=reviewer_id,
            valid_from=valid_from,
            valid_until=valid_until,
            rejection_reason=rejection_reason,
        )

    async def get_center_verifications(self, center_id: UUID) -> List[CenterVerification]:
        return await self.repos.verification.get_verifications_for_center(center_id)

    async def get_center_status_history(self, center_id: UUID) -> List[CenterStatusHistory]:
        return await self.repos.verification.get_status_history(center_id)
